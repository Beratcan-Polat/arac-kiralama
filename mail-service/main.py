"""Reservation mail receiver with signed, durable HookDesk receipts.

Receipt claiming prevents ordinary duplicate and concurrent sends. SMTP cannot
participate in the SQLite transaction: a process crash after SMTP acceptance but
before marking the receipt sent can still cause a duplicate on retry. A stable
Message-ID helps investigation; it is not an exactly-once delivery guarantee.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import date, datetime
from email.message import EmailMessage
import hashlib
import hmac
import os
from pathlib import Path
import re
import sqlite3
import time
from typing import Annotated, Awaitable, Callable, Literal
import uuid

import aiosmtplib
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ConfigDict, EmailStr, Field, ValidationError, field_validator

load_dotenv()

MAX_BODY_BYTES = 256 * 1024
SIGNATURE_TOLERANCE_SECONDS = 300
LEASE_SECONDS = 30
SMTP_DEADLINE_SECONDS = 6
ULID_PATTERN = r"[0-9A-HJKMNP-TV-Z]{26}"


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name, str(default)).lower()
    if value not in {"true", "false"}:
        raise ValueError(f"{name} must be true or false")
    return value == "true"


@dataclass(frozen=True)
class Settings:
    hookdesk_enabled: bool = False
    signing_secret: str = ""
    receipts_db: str = "./data/receipts.sqlite3"
    demo: bool = False
    demo_endpoint_id: str = ""
    demo_failures: int = 0
    mail_host: str = ""
    mail_port: int = 587
    mail_from: str = ""
    mail_user: str | None = None
    mail_pass: str | None = None
    mail_start_tls: bool = True
    mail_use_tls: bool = False

    @classmethod
    def from_environment(cls) -> Settings:
        return cls(
            hookdesk_enabled=env_bool("HOOKDESK_ENABLED"),
            signing_secret=os.getenv("HOOKDESK_SIGNING_SECRET", ""),
            receipts_db=os.getenv("HOOKDESK_RECEIPTS_DB", "./data/receipts.sqlite3"),
            demo=env_bool("HOOKDESK_DEMO"),
            demo_endpoint_id=os.getenv("HOOKDESK_DEMO_ENDPOINT_ID", ""),
            demo_failures=int(os.getenv("HOOKDESK_DEMO_FAILURES", "0")),
            mail_host=os.getenv("MAIL_HOST", ""),
            mail_port=int(os.getenv("MAIL_PORT", "587")),
            mail_from=os.getenv("MAIL_FROM") or os.getenv("MAIL_USER", ""),
            mail_user=os.getenv("MAIL_USER") or None,
            mail_pass=os.getenv("MAIL_PASS") or None,
            mail_start_tls=env_bool("MAIL_START_TLS", True),
            mail_use_tls=env_bool("MAIL_USE_TLS"),
        )

    def validate(self, *, webhook: bool = False) -> None:
        if not self.mail_host or not self.mail_from or not 1 <= self.mail_port <= 65535:
            raise ValueError("incomplete_mail_configuration")
        if "\n" in self.mail_from or "\r" in self.mail_from:
            raise ValueError("invalid_mail_configuration")
        if bool(self.mail_user) != bool(self.mail_pass):
            raise ValueError("incomplete_smtp_authentication")
        if self.mail_use_tls and self.mail_start_tls:
            raise ValueError("conflicting_tls_configuration")
        if webhook:
            if not self.hookdesk_enabled or len(self.signing_secret) < 32 or not self.receipts_db:
                raise ValueError("incomplete_hookdesk_configuration")
            if self.demo and not re.fullmatch(ULID_PATTERN, self.demo_endpoint_id):
                raise ValueError("invalid_demo_endpoint")
            if self.demo_failures not in {0, 1, 2} or (self.demo_failures and not self.demo):
                raise ValueError("invalid_demo_failure_configuration")


class MailRequest(BaseModel):
    """Keep the original Java mail DTO aliases for deployments without HookDesk."""

    model_config = ConfigDict(populate_by_name=True)
    email: EmailStr
    subject: str = Field(alias="baslik", max_length=200)
    message: str = Field(alias="mesaj", max_length=MAX_BODY_BYTES)


class Customer(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr


class Vehicle(BaseModel):
    model_config = ConfigDict(extra="forbid")
    brand: str = Field(min_length=1, max_length=255)
    model: str = Field(min_length=1, max_length=255)
    # Existing vehicle rows may not have a plate yet; it is informational in mail.
    plate: str | None = Field(max_length=30)


class RentalCreated(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rental_id: Annotated[int, Field(strict=True, gt=0)]
    customer: Customer
    vehicle: Vehicle
    pickup_date: date
    return_date: date
    total_price: str = Field(pattern=r"^\d{1,12}(\.\d{1,2})?$", max_length=15)
    currency: Literal["TRY"]


class Envelope(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: Literal[1]
    id: str = Field(pattern=f"^{ULID_PATTERN}$")
    type: Literal["rental.created"]
    created_at: datetime
    data: RentalCreated

    @field_validator("created_at")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timezone_required")
        return value


class ReceiptStore:
    def __init__(self, path: str):
        self.path = path

    def connect(self) -> sqlite3.Connection:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path, timeout=1, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout = 1000")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("""
            CREATE TABLE IF NOT EXISTS receipts (
                event_id TEXT PRIMARY KEY,
                body_hash TEXT NOT NULL,
                state TEXT NOT NULL CHECK (state IN ('pending', 'sending', 'sent')),
                lease_token TEXT,
                lease_until REAL NOT NULL DEFAULT 0,
                request_count INTEGER NOT NULL DEFAULT 0,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
        """)
        return connection

    def check(self) -> None:
        connection = self.connect()
        try:
            connection.execute("SELECT 1 FROM receipts LIMIT 1").fetchone()
        finally:
            connection.close()

    def claim(self, event_id: str, body_hash: str, now: float, demo_failures: int) -> tuple[str, str | None]:
        connection = self.connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """INSERT OR IGNORE INTO receipts
                   (event_id, body_hash, state, created_at, updated_at)
                   VALUES (?, ?, 'pending', ?, ?)""",
                (event_id, body_hash, now, now),
            )
            row = connection.execute("SELECT * FROM receipts WHERE event_id = ?", (event_id,)).fetchone()
            if row["body_hash"] != body_hash:
                connection.rollback()
                return "conflict", None
            count = row["request_count"] + 1
            connection.execute(
                "UPDATE receipts SET request_count = ?, updated_at = ? WHERE event_id = ?",
                (count, now, event_id),
            )
            if row["state"] == "sent":
                outcome = "duplicate", None
            elif row["state"] == "sending" and row["lease_until"] > now:
                outcome = "busy", None
            elif count <= demo_failures:
                outcome = "demo_failure", None
            else:
                token = uuid.uuid4().hex
                connection.execute(
                    """UPDATE receipts SET state = 'sending', lease_token = ?, lease_until = ?
                       WHERE event_id = ?""",
                    (token, now + LEASE_SECONDS, event_id),
                )
                outcome = "claimed", token
            connection.commit()
            return outcome
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def finish(self, event_id: str, token: str, now: float, *, sent: bool) -> bool:
        connection = self.connect()
        try:
            cursor = connection.execute(
                """UPDATE receipts SET state = ?, lease_token = NULL, lease_until = 0, updated_at = ?
                   WHERE event_id = ? AND state = 'sending' AND lease_token = ?""",
                ("sent" if sent else "pending", now, event_id, token),
            )
            return cursor.rowcount == 1
        finally:
            connection.close()


def unavailable() -> HTTPException:
    return HTTPException(status_code=503, detail="receiver_unavailable", headers={"Retry-After": "2"})


def reservation_message(event: Envelope, sender: str) -> EmailMessage:
    data = event.data
    message = EmailMessage()
    message["From"] = sender
    message["To"] = str(data.customer.email)
    message["Subject"] = "Rezervasyon Onayı"
    message["Message-ID"] = f"<hookdesk-{event.id}@arac-kiralama.invalid>"
    message.set_content(
        f"Sayın {data.customer.name},\n\n"
        "Rezervasyonunuz başarıyla alınmıştır.\n"
        f"Rezervasyon: {data.rental_id}\n"
        f"Araç: {data.vehicle.brand} {data.vehicle.model}\n"
        f"Plaka: {data.vehicle.plate or 'Belirtilmedi'}\n"
        f"Alış Tarihi: {data.pickup_date.isoformat()}\n"
        f"İade Tarihi: {data.return_date.isoformat()}\n"
        f"Toplam Tutar: {data.total_price} TL\n"
    )
    return message


SmtpSender = Callable[..., Awaitable[object]]


def create_app(
    settings: Settings | None = None,
    smtp_send: SmtpSender | None = None,
    clock: Callable[[], float] = time.time,
) -> FastAPI:
    settings = settings or Settings.from_environment()
    smtp_send = smtp_send or aiosmtplib.send
    store = ReceiptStore(settings.receipts_db)
    application = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

    async def configuration_ready(*, webhook: bool) -> None:
        try:
            settings.validate(webhook=webhook)
            if webhook:
                await asyncio.to_thread(store.check)
        except (ValueError, OSError, sqlite3.Error):
            raise unavailable() from None

    async def deliver_smtp(message: EmailMessage) -> None:
        await asyncio.wait_for(
            smtp_send(
                message,
                hostname=settings.mail_host,
                port=settings.mail_port,
                username=settings.mail_user,
                password=settings.mail_pass,
                use_tls=settings.mail_use_tls,
                start_tls=settings.mail_start_tls,
                timeout=5,
            ),
            timeout=SMTP_DEADLINE_SECONDS,
        )

    @application.get("/health")
    async def health():
        await configuration_ready(webhook=settings.hookdesk_enabled)
        return {"status": "ok"}

    @application.post("/send-mail")
    async def send_legacy_mail(request: Request):
        if settings.hookdesk_enabled:
            raise HTTPException(status_code=404, detail="not_found")
        await configuration_ready(webhook=False)
        try:
            payload = MailRequest.model_validate_json(await bounded_body(request))
            message = EmailMessage()
            message["From"] = settings.mail_from
            message["To"] = str(payload.email)
            message["Subject"] = payload.subject
            message.set_content(payload.message)
        except (ValidationError, ValueError):
            raise HTTPException(status_code=422, detail="invalid_mail_request") from None
        try:
            await deliver_smtp(message)
        except Exception:
            raise unavailable() from None
        return {"status": "ok", "message": "Mail gönderildi"}

    async def receive_signed(request: Request):
        if not settings.hookdesk_enabled:
            raise HTTPException(status_code=404, detail="not_found")
        await configuration_ready(webhook=True)
        body = await bounded_body(request)
        timestamp = request.headers.get("X-HookDesk-Timestamp", "")
        signature = request.headers.get("X-HookDesk-Signature", "")
        if not re.fullmatch(r"[0-9]{1,12}", timestamp) or not re.fullmatch(r"v1=[0-9a-f]{64}", signature):
            raise HTTPException(status_code=401, detail="invalid_signature")
        if abs(clock() - int(timestamp)) > SIGNATURE_TOLERANCE_SECONDS:
            raise HTTPException(status_code=401, detail="invalid_signature")
        expected = "v1=" + hmac.new(
            settings.signing_secret.encode("utf-8"), timestamp.encode("ascii") + b"." + body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=401, detail="invalid_signature")
        try:
            event = Envelope.model_validate_json(body)
        except ValidationError:
            raise HTTPException(status_code=422, detail="invalid_event") from None
        if request.headers.get("X-HookDesk-Event-Id") != event.id:
            raise HTTPException(status_code=422, detail="event_id_mismatch")
        try:
            outcome, token = await asyncio.to_thread(
                store.claim, event.id, hashlib.sha256(body).hexdigest(), clock(), settings.demo_failures if settings.demo else 0
            )
        except (OSError, sqlite3.Error):
            raise unavailable() from None
        if outcome == "conflict":
            raise HTTPException(status_code=409, detail="event_conflict")
        if outcome == "duplicate":
            return {"received": True, "duplicate": True, "event_id": event.id}
        if outcome in {"busy", "demo_failure"}:
            raise unavailable()
        try:
            await deliver_smtp(reservation_message(event, settings.mail_from))
        except Exception:
            try:
                await asyncio.to_thread(store.finish, event.id, token, clock(), sent=False)
            except (OSError, sqlite3.Error):
                pass
            raise unavailable() from None
        try:
            completed = await asyncio.to_thread(store.finish, event.id, token, clock(), sent=True)
        except (OSError, sqlite3.Error):
            raise unavailable() from None
        if not completed:
            raise unavailable()
        return {"received": True, "duplicate": False, "event_id": event.id}

    @application.post("/webhooks/hookdesk")
    async def hookdesk_webhook(request: Request):
        return await receive_signed(request)

    @application.post("/receive/{endpoint_id}")
    async def sandbox_webhook(endpoint_id: str, request: Request):
        if not settings.demo or not settings.hookdesk_enabled or endpoint_id != settings.demo_endpoint_id:
            raise HTTPException(status_code=404, detail="not_found")
        return await receive_signed(request)

    return application


async def bounded_body(request: Request) -> bytes:
    content_length = request.headers.get("content-length")
    if content_length and (not re.fullmatch(r"[0-9]{1,12}", content_length) or int(content_length) > MAX_BODY_BYTES):
        raise HTTPException(status_code=413, detail="payload_too_large")
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_BODY_BYTES:
            raise HTTPException(status_code=413, detail="payload_too_large")
        body.extend(chunk)
    return bytes(body)


app = create_app()
