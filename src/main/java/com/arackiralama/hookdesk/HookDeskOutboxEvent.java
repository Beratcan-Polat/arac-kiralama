package com.arackiralama.hookdesk;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hookdesk_outbox", indexes = @Index(name = "hookdesk_outbox_due", columnList = "status,next_attempt_at"))
public class HookDeskOutboxEvent {
    public enum Status { PENDING, PROCESSING, SENT, FAILED, UNROUTED }

    @Id @Column(length = 36, updatable = false)
    private String id;
    @Column(name = "rental_id", nullable = false, unique = true, updatable = false)
    private Long rentalId;
    @Column(nullable = false, columnDefinition = "TEXT", updatable = false)
    private String body;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24)
    private Status status;
    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "next_attempt_at", nullable = false)
    private Instant nextAttemptAt;
    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;
    @Column(name = "locked_until")
    private Instant lockedUntil;
    @Column(name = "lease_token", length = 36)
    private String leaseToken;
    @Column(name = "hookdesk_event_id", length = 26)
    private String hookdeskEventId;
    @Column(name = "accepted_at")
    private Instant acceptedAt;
    @Column(name = "last_error", length = 80)
    private String lastError;

    protected HookDeskOutboxEvent() {}

    HookDeskOutboxEvent(Long rentalId, String body, Instant now) {
        this.id = UUID.randomUUID().toString();
        this.rentalId = rentalId;
        this.body = body;
        this.status = Status.PENDING;
        this.createdAt = now;
        this.nextAttemptAt = now;
        // Leave a minute of margin before HookDesk's 24-hour idempotency retention.
        this.expiresAt = now.plusSeconds(24 * 60 * 60 - 60);
    }

    public String getId() { return id; }
    public Long getRentalId() { return rentalId; }
    public String getBody() { return body; }
    public Status getStatus() { return status; }
    public int getAttemptCount() { return attemptCount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getLockedUntil() { return lockedUntil; }
    public String getLeaseToken() { return leaseToken; }
    public String getHookdeskEventId() { return hookdeskEventId; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public String getLastError() { return lastError; }
    public String idempotencyKey() { return "rental.created:" + id; }

    boolean isClaimable(Instant now) {
        return (status == Status.PENDING && !nextAttemptAt.isAfter(now))
                || (status == Status.PROCESSING && lockedUntil != null && !lockedUntil.isAfter(now));
    }

    void claim(Instant now) {
        status = Status.PROCESSING;
        attemptCount++;
        leaseToken = UUID.randomUUID().toString();
        lockedUntil = now.plusSeconds(30);
    }

    void complete(Status status, String error, String eventId, Instant now, Instant retryAt) {
        this.status = status;
        this.lastError = error;
        this.hookdeskEventId = eventId;
        if (eventId != null) this.acceptedAt = now;
        if (retryAt != null) this.nextAttemptAt = retryAt;
        this.leaseToken = null;
        this.lockedUntil = null;
    }
}
