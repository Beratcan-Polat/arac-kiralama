package com.arackiralama.hookdesk;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class HookDeskDispatcher {
    private static final Logger LOG = LoggerFactory.getLogger(HookDeskDispatcher.class);
    private static final int[] DELAYS = {10, 30, 60, 300, 900, 3600};
    private final HookDeskProperties properties;
    private final HookDeskOutboxStore store;
    private final HookDeskHttpClient http;
    private final ObjectMapper json;

    public HookDeskDispatcher(HookDeskProperties properties, HookDeskOutboxStore store, HookDeskHttpClient http, ObjectMapper json) {
        this.properties = properties;
        this.store = store;
        this.http = http;
        this.json = json;
    }

    @Scheduled(fixedDelayString = "${hookdesk.poll-delay-ms:2000}", initialDelayString = "${hookdesk.poll-delay-ms:2000}")
    public void scheduledDispatch() {
        if (!properties.isEnabled() || !properties.isSchedulingEnabled()) return;
        try {
            for (int i = 0; i < 10; i++) if (!dispatchOnce()) break;
        } catch (RuntimeException e) {
            LOG.warn("HookDesk outbox polling failed; pending rows will be retried");
        }
    }

    public boolean dispatchOnce() {
        if (!properties.isEnabled()) return false;
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("HookDesk dispatch must run outside the rental transaction");
        }
        Optional<HookDeskOutboxStore.Claim> next = store.claimNext(Instant.now());
        if (next.isEmpty()) return false;
        HookDeskOutboxStore.Claim claim = next.get();
        try {
            HookDeskHttpClient.Result result = http.send(claim);
            if (result.status() == 202) {
                accept(claim, result.body());
            } else if (result.status() == 408 || result.status() == 425 || result.status() == 429 || result.status() >= 500) {
                retry(claim, "http_" + result.status(), result.retryAfter());
            } else {
                finish(claim, HookDeskOutboxEvent.Status.FAILED, "http_" + result.status(), null);
            }
        } catch (InterruptedException e) {
            retry(claim, "interrupted", null);
            Thread.currentThread().interrupt();
        } catch (IOException e) {
            retry(claim, "network_error", null);
        } catch (RuntimeException e) {
            // An uncertain result is retried with the same body and key, never as a new event.
            retry(claim, "unexpected_transport_error", null);
        }
        return true;
    }

    private void accept(HookDeskOutboxStore.Claim claim, String body) {
        try {
            JsonNode data = json.readTree(body).path("data");
            String id = data.path("id").asText("");
            if (!id.matches("[0-7][0-9A-HJKMNP-TV-Z]{25}") || !data.path("delivery_count").isIntegralNumber()
                    || !data.path("routing_result").isTextual()) {
                retry(claim, "invalid_acceptance_response", null);
                return;
            }
            boolean routed = data.path("delivery_count").asInt() > 0 && data.path("routing_result").asText().equals("routed");
            finish(claim, routed ? HookDeskOutboxEvent.Status.SENT : HookDeskOutboxEvent.Status.UNROUTED,
                    routed ? null : "no_matching_endpoints", id);
        } catch (IOException | NullPointerException e) {
            retry(claim, "invalid_acceptance_response", null);
        }
    }

    private void retry(HookDeskOutboxStore.Claim claim, String error, String retryAfter) {
        Instant now = Instant.now();
        long delay = Math.max(DELAYS[Math.min(claim.attempt() - 1, DELAYS.length - 1)], retryAfterSeconds(retryAfter, now));
        store.complete(claim, HookDeskOutboxEvent.Status.PENDING, error, null, now, now.plusSeconds(delay));
    }

    private void finish(HookDeskOutboxStore.Claim claim, HookDeskOutboxEvent.Status status, String error, String id) {
        store.complete(claim, status, error, id, Instant.now(), null);
        if (status != HookDeskOutboxEvent.Status.SENT) {
            LOG.warn("HookDesk outbox {} stopped with status {} ({})", claim.id(), status, error);
        }
    }

    static long retryAfterSeconds(String value, Instant now) {
        if (value == null || value.length() > 100) return 0;
        try {
            if (value.matches("[0-9]+")) return Math.min(3600, Long.parseLong(value));
            Instant date = ZonedDateTime.parse(value, DateTimeFormatter.RFC_1123_DATE_TIME).toInstant();
            return Math.max(0, Math.min(3600, date.getEpochSecond() - now.getEpochSecond()));
        } catch (NumberFormatException | DateTimeParseException e) { return 0; }
    }
}
