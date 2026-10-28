import asyncio
from dataclasses import replace
from email import policy
from email.parser import BytesParser
import hashlib
import hmac
import json
import sqlite3

from fastapi.testclient import TestClient
import httpx
import pytest

from main import MAX_BODY_BYTES, ReceiptStore, Settings, create_app


NOW = 1_793_188_800
EVENT_ID = "01K6KB5XRYC6XBQG4VKRW8S1NH"
ENDPOINT_ID = "01K6KB5XRYC6XBQG4VKRW8S1NJ"
SECRET = "whsec_" + "s" * 48


def event_body(**overrides):
    event = {
        "version": 1,
        "id": EVENT_ID,
        "type": "rental.created",
        "created_at": "2026-10-28T12:00:00Z",
        "data": {
            "rental_id": 42,
            "customer": {"name": "Deneme Müşteri", "email": "musteri@example.com"},
            "vehicle": {"brand": "Renault", "model": "Clio", "plate": "02 HD 042"},
            "pickup_date": "2026-11-01",
            "return_date": "2026-11-03",
            "total_price": "2400.00",
            "currency": "TRY",
        },
    }
    event.update(overrides)
    return json.dumps(event, ensure_ascii=False, separators=(",", ":")).encode()


def headers(body, timestamp=NOW, event_id=EVENT_ID):
    stamp = str(timestamp)
    signature = hmac.new(SECRET.encode(), stamp.encode() + b"." + body, hashlib.sha256).hexdigest()
    return {
        "content-type": "application/json",
        "X-HookDesk-Event-Id": event_id,
        "X-HookDesk-Timestamp": stamp,
        "X-HookDesk-Signature": "v1=" + signature,
    }


@pytest.fixture
def settings(tmp_path):
    return Settings(
        hookdesk_enabled=True,
        signing_secret=SECRET,
        receipts_db=str(tmp_path / "receipts.sqlite3"),
        mail_host="mailpit",
        mail_port=1025,
        mail_from="kiralama@example.com",
        mail_start_tls=False,
    )


@pytest.fixture
def sent():
    return []


def client_for(settings, sent):
    async def smtp(message, **options):
        sent.append((message, options))

    return TestClient(create_app(settings, smtp, clock=lambda: NOW))


def post(client, body=None, request_headers=None, path="/webhooks/hookdesk"):
    body = event_body() if body is None else body
    return client.post(path, content=body, headers=request_headers or headers(body))


def test_signed_event_sends_confirmation_and_persists_deduplication(settings, sent):
    client = client_for(settings, sent)
    first = post(client)
    assert first.status_code == 200
    assert first.json() == {"received": True, "duplicate": False, "event_id": EVENT_ID}
    # New app process, same persistent volume: replay still must not email twice.
    restarted = client_for(settings, sent)
    assert post(restarted).json()["duplicate"] is True
    assert len(sent) == 1
    message, options = sent[0]
    assert message["Subject"] == "Rezervasyon Onayı"
    assert message["To"] == "musteri@example.com"
    assert "Rezervasyon: 42" in message.get_content()
    assert "Renault Clio" in message.get_content()
    assert "2400.00 TL" in message.get_content()
    assert message["Message-ID"] == f"<hookdesk-{EVENT_ID}@arac-kiralama.invalid>"
    assert options["start_tls"] is False
    assert options["username"] is None
    assert options["timeout"] == 5
    connection = sqlite3.connect(settings.receipts_db)
    row = connection.execute("SELECT state, request_count, body_hash FROM receipts").fetchone()
    assert row == ("sent", 2, hashlib.sha256(event_body()).hexdigest())
    # Store hashes/identifiers only, without copying customer payloads.
    assert "musteri@example.com" not in " ".join(str(value) for value in row)
    connection.close()


@pytest.mark.parametrize("offset", [-301, 301])
def test_expired_or_future_timestamp_is_rejected(settings, sent, offset):
    body = event_body()
    result = post(client_for(settings, sent), body, headers(body, NOW + offset))
    assert result.status_code == 401
    assert not sent


@pytest.mark.parametrize("offset", [-300, 300])
def test_timestamp_boundary_is_accepted(settings, sent, offset):
    body = event_body()
    assert post(client_for(settings, sent), body, headers(body, NOW + offset)).status_code == 200


@pytest.mark.parametrize("signature", ["", "v2=" + "a" * 64, "v1=" + "a" * 64, "v1=" + "A" * 64])
def test_invalid_or_malformed_signature_is_rejected(settings, sent, signature):
    body = event_body()
    signed = headers(body)
    signed["X-HookDesk-Signature"] = signature
    assert post(client_for(settings, sent), body, signed).status_code == 401
    assert not sent


def test_tampered_raw_bytes_are_rejected(settings, sent):
    original = event_body()
    assert post(client_for(settings, sent), original + b" ", headers(original)).status_code == 401
    assert not sent


@pytest.mark.parametrize("stamp", ["x", "-1", "9" * 30])
def test_invalid_timestamp_syntax_is_rejected(settings, sent, stamp):
    signed = headers(event_body())
    signed["X-HookDesk-Timestamp"] = stamp
    assert post(client_for(settings, sent), request_headers=signed).status_code == 401


def test_header_event_id_must_match_signed_envelope(settings, sent):
    body = event_body()
    result = post(client_for(settings, sent), body, headers(body, event_id=ENDPOINT_ID))
    assert result.status_code == 422
    assert result.json()["detail"] == "event_id_mismatch"
    assert not sent


@pytest.mark.parametrize("overrides", [{"type": "rental.cancelled"}, {"version": 2}, {"created_at": "2026-10-28T12:00:00"}, {"data": {}}, {"id": "not-an-event-id"}])
def test_invalid_event_contract_is_rejected_without_payload_in_response(settings, sent, overrides):
    result = post(client_for(settings, sent), event_body(**overrides))
    assert result.status_code == 422
    assert result.json() == {"detail": "invalid_event"}
    assert not sent


def test_event_id_reuse_with_different_body_is_conflict(settings, sent):
    client = client_for(settings, sent)
    assert post(client).status_code == 200
    # Same event ID but different valid bytes must never produce another effect.
    changed = event_body() + b" "
    assert post(client, changed).status_code == 409
    assert len(sent) == 1


def test_existing_vehicle_without_plate_and_full_length_names_is_supported(settings, sent):
    event = json.loads(event_body())
    event["data"]["customer"]["name"] = "A" * 255
    event["data"]["vehicle"] = {"brand": "B" * 255, "model": "M" * 255, "plate": None}
    body = json.dumps(event, ensure_ascii=False).encode()
    assert post(client_for(settings, sent), body).status_code == 200
    assert "Plaka: Belirtilmedi" in sent[0][0].get_content()


def test_body_limit_checks_actual_stream_without_content_length(settings, sent):
    async def scenario():
        application = create_app(settings, clock=lambda: NOW)

        async def oversized_stream():
            yield b"x" * (MAX_BODY_BYTES // 2)
            yield b"x" * (MAX_BODY_BYTES // 2 + 1)

        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=application), base_url="http://test") as client:
            response = await client.post("/webhooks/hookdesk", content=oversized_stream(), headers={"content-type": "application/json"})
            assert response.status_code == 413

    asyncio.run(scenario())
    assert not sent


def test_declared_body_limit_is_rejected(settings, sent):
    body = b"x" * (MAX_BODY_BYTES + 1)
    assert post(client_for(settings, sent), body).status_code == 413


def test_smtp_failure_releases_claim_for_retry_without_leaking_details(settings):
    calls = []

    async def smtp(message, **options):
        calls.append(message)
        if len(calls) == 1:
            raise RuntimeError("SMTP password=secret recipient=musteri@example.com")

    client = TestClient(create_app(settings, smtp, clock=lambda: NOW))
    failure = post(client)
    assert failure.status_code == 503
    assert failure.json() == {"detail": "receiver_unavailable"}
    assert failure.headers["Retry-After"] == "2"
    assert post(client).status_code == 200
    assert post(client).json()["duplicate"] is True
    assert len(calls) == 2


def test_concurrent_delivery_has_one_smtp_claim(settings):
    async def scenario():
        started = asyncio.Event()
        release = asyncio.Event()
        sent = []

        async def smtp(message, **options):
            sent.append(message)
            started.set()
            await release.wait()

        application = create_app(settings, smtp, clock=lambda: NOW)
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=application), base_url="http://test") as client:
            first = asyncio.create_task(client.post("/webhooks/hookdesk", content=event_body(), headers=headers(event_body())))
            await asyncio.wait_for(started.wait(), timeout=2)
            second = await client.post("/webhooks/hookdesk", content=event_body(), headers=headers(event_body()))
            assert second.status_code == 503
            release.set()
            assert (await first).status_code == 200
            third = await client.post("/webhooks/hookdesk", content=event_body(), headers=headers(event_body()))
            assert third.json()["duplicate"] is True
            assert len(sent) == 1

    asyncio.run(scenario())


def test_expired_claim_is_recovered_and_stale_owner_cannot_finish(settings):
    store = ReceiptStore(settings.receipts_db)
    state, old_token = store.claim(EVENT_ID, "hash", NOW, 0)
    assert state == "claimed"
    assert store.claim(EVENT_ID, "hash", NOW + 1, 0)[0] == "busy"
    state, new_token = store.claim(EVENT_ID, "hash", NOW + 31, 0)
    assert state == "claimed"
    assert old_token != new_token
    assert store.finish(EVENT_ID, old_token, NOW + 32, sent=True) is False
    assert store.finish(EVENT_ID, new_token, NOW + 32, sent=True) is True


def test_demo_route_requires_explicit_mode_and_exact_provisioned_endpoint(settings, sent):
    client = client_for(settings, sent)
    assert post(client, path=f"/receive/{ENDPOINT_ID}").status_code == 404
    demo = client_for(replace(settings, demo=True, demo_endpoint_id=ENDPOINT_ID), sent)
    assert post(demo, path=f"/receive/{EVENT_ID}").status_code == 404
    assert post(demo, path=f"/receive/{ENDPOINT_ID}").status_code == 200
    assert len(sent) == 1


def test_demo_failures_survive_receiver_restart_then_send_once(settings, sent):
    settings = replace(settings, demo=True, demo_endpoint_id=ENDPOINT_ID, demo_failures=2)
    path = f"/receive/{ENDPOINT_ID}"
    assert post(client_for(settings, sent), path=path).status_code == 503
    assert post(client_for(settings, sent), path=path).status_code == 503
    assert not sent
    client = client_for(settings, sent)
    assert post(client, path=path).status_code == 200
    assert post(client, path=path).json()["duplicate"] is True
    assert len(sent) == 1


@pytest.mark.parametrize("changes", [{"signing_secret": ""}, {"mail_host": ""}, {"mail_user": "user", "mail_pass": None}, {"mail_use_tls": True, "mail_start_tls": True}, {"demo_failures": 2}, {"demo": True, "demo_endpoint_id": ""}])
def test_incomplete_or_unsafe_configuration_fails_closed(settings, sent, changes):
    client = client_for(replace(settings, **changes), sent)
    assert client.get("/health").status_code == 503
    assert post(client).status_code == 503
    assert not sent


def test_disabled_mode_keeps_legacy_aliases_but_disables_hookdesk(settings, sent):
    client = client_for(replace(settings, hookdesk_enabled=False), sent)
    result = client.post("/send-mail", json={"email": "musteri@example.com", "baslik": "Rezervasyon Onayı", "mesaj": "Merhaba"})
    assert result.status_code == 200
    assert client.get("/health").json() == {"status": "ok"}
    assert post(client).status_code == 404
    assert len(sent) == 1


def test_unsigned_legacy_mail_cannot_bypass_hookdesk_signature(settings, sent):
    client = client_for(settings, sent)
    result = client.post("/send-mail", json={"email": "musteri@example.com", "baslik": "Atlatma", "mesaj": "Merhaba"})
    assert result.status_code == 404
    assert not sent


def test_legacy_header_injection_is_rejected(settings, sent):
    client = client_for(replace(settings, hookdesk_enabled=False), sent)
    result = client.post("/send-mail", json={"email": "musteri@example.com", "baslik": "Başlık\r\nBcc: other@example.com", "mesaj": "Merhaba"})
    assert result.status_code == 422
    assert not sent


def test_signed_delivery_reaches_real_local_smtp_protocol(settings):
    async def scenario():
        messages = []

        async def smtp_server(reader, writer):
            writer.write(b"220 localhost test SMTP\r\n")
            await writer.drain()
            try:
                while command := await reader.readline():
                    command = command.upper()
                    if command.startswith(b"EHLO"):
                        writer.write(b"250-localhost\r\n250 SMTPUTF8\r\n")
                    elif command.startswith(b"DATA"):
                        writer.write(b"354 Send data\r\n")
                        await writer.drain()
                        content = bytearray()
                        while line := await reader.readline():
                            if line == b".\r\n":
                                break
                            content.extend(line)
                        messages.append(BytesParser(policy=policy.default).parsebytes(bytes(content)))
                        writer.write(b"250 accepted\r\n")
                    elif command.startswith(b"QUIT"):
                        writer.write(b"221 goodbye\r\n")
                        await writer.drain()
                        break
                    else:
                        writer.write(b"250 ok\r\n")
                    await writer.drain()
            finally:
                writer.close()
                await writer.wait_closed()

        server = await asyncio.start_server(smtp_server, "127.0.0.1", 0)
        port = server.sockets[0].getsockname()[1]
        application = create_app(replace(settings, mail_host="127.0.0.1", mail_port=port), clock=lambda: NOW)
        async with server, httpx.AsyncClient(transport=httpx.ASGITransport(app=application), base_url="http://test") as client:
            response = await client.post("/webhooks/hookdesk", content=event_body(), headers=headers(event_body()))
            assert response.status_code == 200
            duplicate = await client.post("/webhooks/hookdesk", content=event_body(), headers=headers(event_body()))
            assert duplicate.json()["duplicate"] is True
        assert len(messages) == 1
        assert messages[0]["Subject"] == "Rezervasyon Onayı"
        assert messages[0]["To"] == "musteri@example.com"
        assert "2400.00 TL" in messages[0].get_content()

    asyncio.run(scenario())
