package com.arackiralama.hookdesk;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HookDeskOutboxStore {
    public record Claim(String id, String body, String idempotencyKey, String leaseToken, int attempt, Instant expiresAt) {}
    private final HookDeskOutboxRepository repository;

    public HookDeskOutboxStore(HookDeskOutboxRepository repository) { this.repository = repository; }

    @Transactional
    public Optional<Claim> claimNext(Instant now) {
        for (String id : repository.findDueIds(now, HookDeskOutboxEvent.Status.PENDING,
                HookDeskOutboxEvent.Status.PROCESSING, PageRequest.of(0, 20))) {
            HookDeskOutboxEvent event = repository.lockById(id).orElse(null);
            if (event == null || !event.isClaimable(now)) continue;
            if (!event.getExpiresAt().isAfter(now.plusSeconds(15))) {
                event.complete(HookDeskOutboxEvent.Status.FAILED, "idempotency_window_expired", null, now, null);
                continue;
            }
            event.claim(now);
            return Optional.of(new Claim(event.getId(), event.getBody(), event.idempotencyKey(),
                    event.getLeaseToken(), event.getAttemptCount(), event.getExpiresAt()));
        }
        return Optional.empty();
    }

    @Transactional
    public void complete(Claim claim, HookDeskOutboxEvent.Status status, String error, String eventId, Instant now, Instant retryAt) {
        HookDeskOutboxEvent event = repository.lockById(claim.id()).orElse(null);
        if (event == null || event.getStatus() != HookDeskOutboxEvent.Status.PROCESSING
                || !claim.leaseToken().equals(event.getLeaseToken())) return;
        if (status == HookDeskOutboxEvent.Status.PENDING && !retryAt.isBefore(event.getExpiresAt().minusSeconds(15))) {
            status = HookDeskOutboxEvent.Status.FAILED;
            error = "idempotency_window_expired";
            retryAt = null;
        }
        event.complete(status, error, eventId, now, retryAt);
    }
}
