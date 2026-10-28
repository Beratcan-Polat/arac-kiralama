package com.arackiralama.hookdesk;

import com.arackiralama.dto.KiralamaIstegi;
import com.arackiralama.model.*;
import com.arackiralama.servis.KiralamaServis;
import com.arackiralama.servis.MailServis;
import com.arackiralama.veritabani.AracRepository;
import com.arackiralama.veritabani.KiralamaRepository;
import com.arackiralama.veritabani.KullaniciRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {"hookdesk.enabled=true", "hookdesk.base-url=http://127.0.0.1:1", "hookdesk.api-key=hd_test"})
class HookDeskOutboxIntegrationTest {
    @Autowired KiralamaServis rentalService;
    @Autowired KiralamaRepository rentals;
    @Autowired AracRepository vehicles;
    @Autowired KullaniciRepository users;
    @Autowired HookDeskOutboxRepository outbox;
    @Autowired HookDeskOutboxStore store;
    @Autowired HookDeskDispatcher dispatcher;
    @Autowired HookDeskOutbox enqueue;
    @Autowired PlatformTransactionManager transactions;
    @Autowired ObjectMapper json;
    @MockBean MailServis legacyMail;
    @MockBean HookDeskHttpClient http;
    private KiralamaIstegi request;

    @BeforeEach
    void prepare() {
        outbox.deleteAll();
        rentals.deleteAll();
        vehicles.deleteAll();
        users.deleteAll();
        Kullanici user = users.save(new Kullanici("Demo Müşteri", "rental@example.com", "not-a-login", Rol.MUSTERI));
        Arac vehicle = new Arac();
        vehicle.setMarka("Toyota"); vehicle.setModel("Corolla"); vehicle.setPlaka("02 DEMO 01");
        vehicle.setGunlukFiyat(new BigDecimal("1200.00")); vehicle.setDurum(AracDurum.MUSAIT);
        vehicles.save(vehicle);
        request = new KiralamaIstegi();
        request.setAracId(vehicle.getId()); request.setKullaniciId(user.getId());
        request.setAlisTarihi(LocalDate.of(2027, 1, 1)); request.setIadeTarihi(LocalDate.of(2027, 1, 3));
    }

    @Test
    void reservationAndOutboxCommitTogetherWithoutSendingHttpOrLegacyMail() throws Exception {
        Kiralama rental = rentalService.kiralamaYap(request);
        HookDeskOutboxEvent event = outbox.findAll().get(0);
        var body = json.readTree(event.getBody());
        assertThat(event.getRentalId()).isEqualTo(rental.getId());
        assertThat(event.getStatus()).isEqualTo(HookDeskOutboxEvent.Status.PENDING);
        assertThat(body.path("type").asText()).isEqualTo("rental.created");
        assertThat(body.at("/data/customer/email").asText()).isEqualTo("rental@example.com");
        assertThat(body.at("/data/total_price").asText()).isEqualTo("2400.00");
        assertThat(body.at("/data/currency").asText()).isEqualTo("TRY");
        verifyNoInteractions(http, legacyMail);
    }

    @Test
    void rollbackRemovesBothReservationAndOutboundEvent() {
        new TransactionTemplate(transactions).execute(status -> {
            rentalService.kiralamaYap(request);
            status.setRollbackOnly();
            return null;
        });
        assertThat(rentals.count()).isZero();
        assertThat(outbox.count()).isZero();
    }

    @Test
    void onlineDiscountIsSerializedAsTwoDecimalCurrencyRatherThanFourDecimalIntermediateValue() throws Exception {
        request.setOdemeTipi("ONLINE");
        rentalService.kiralamaYap(request);
        assertThat(json.readTree(outbox.findAll().get(0).getBody()).at("/data/total_price").asText()).isEqualTo("1680.00");
    }

    @Test
    void legacyNullDisplayFieldsDoNotPreventCommittingAReservation() throws Exception {
        Kullanici user = users.findById(request.getKullaniciId()).orElseThrow();
        user.setAd(null); users.save(user);
        Arac vehicle = vehicles.findById(request.getAracId()).orElseThrow();
        vehicle.setPlaka(null); vehicles.save(vehicle);
        rentalService.kiralamaYap(request);
        var body = json.readTree(outbox.findAll().get(0).getBody());
        assertThat(body.at("/data/customer/name").asText()).isEqualTo("Müşterimiz");
        assertThat(body.at("/data/vehicle/plate").isNull()).isTrue();
    }

    @Test
    void enqueueRequiresExistingTransactionAndDispatchRejectsRunningInsideIt() {
        Kiralama rental = rentalService.kiralamaYap(request);
        assertThatThrownBy(() -> enqueue.enqueue(rental)).isInstanceOf(org.springframework.transaction.IllegalTransactionStateException.class);
        new TransactionTemplate(transactions).execute(status -> {
            assertThatThrownBy(() -> dispatcher.dispatchOnce()).isInstanceOf(IllegalStateException.class);
            return null;
        });
    }

    @Test
    void duplicateClaimCannotOwnSameActiveEventAndRecoveredLeaseRejectsOldCompletion() {
        rentalService.kiralamaYap(request);
        Instant now = Instant.now();
        var first = store.claimNext(now).orElseThrow();
        assertThat(store.claimNext(now.plusSeconds(1))).isEmpty();
        var recovered = store.claimNext(now.plusSeconds(31)).orElseThrow();
        assertThat(recovered.id()).isEqualTo(first.id());
        assertThat(recovered.leaseToken()).isNotEqualTo(first.leaseToken());
        assertThat(recovered.body()).isEqualTo(first.body());
        assertThat(recovered.idempotencyKey()).isEqualTo(first.idempotencyKey());
        store.complete(first, HookDeskOutboxEvent.Status.SENT, null, "01ARZ3NDEKTSV4RRFFQ69G5FAV", now, null);
        assertThat(outbox.findById(first.id()).orElseThrow().getLeaseToken()).isEqualTo(recovered.leaseToken());
        store.complete(recovered, HookDeskOutboxEvent.Status.SENT, null, "01ARZ3NDEKTSV4RRFFQ69G5FAV", now, null);
        assertThat(outbox.findById(first.id()).orElseThrow().getStatus()).isEqualTo(HookDeskOutboxEvent.Status.SENT);
    }

    @Test
    void concurrentPollersCannotBothClaimTheSameCommittedEvent() throws Exception {
        rentalService.kiralamaYap(request);
        CountDownLatch start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(() -> { start.await(); return store.claimNext(Instant.now()); });
            var second = executor.submit(() -> { start.await(); return store.claimNext(Instant.now()); });
            start.countDown();
            long claimed = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS))
                    .stream().filter(java.util.Optional::isPresent).count();
            assertThat(claimed).isEqualTo(1);
            assertThat(outbox.findAll().get(0).getAttemptCount()).isEqualTo(1);
        } finally { executor.shutdownNow(); }
    }

    @Test
    void retriesUseSameRawBodyAndIdempotencyKeyAfterUnknownNetworkResult() throws Exception {
        rentalService.kiralamaYap(request);
        when(http.send(any())).thenThrow(new IOException("offline"));
        dispatcher.dispatchOnce();
        HookDeskOutboxEvent event = outbox.findAll().get(0);
        assertThat(event.getStatus()).isEqualTo(HookDeskOutboxEvent.Status.PENDING);
        assertThat(event.getLastError()).isEqualTo("network_error");
        var retry = store.claimNext(event.getNextAttemptAt().plusSeconds(1)).orElseThrow();
        assertThat(retry.body()).isEqualTo(event.getBody());
        assertThat(retry.idempotencyKey()).isEqualTo("rental.created:" + event.getId());
        assertThat(retry.attempt()).isEqualTo(2);
    }

    @Test
    void permanentHttpFailureStopsButRetryAfterRateLimitWaits() throws Exception {
        rentalService.kiralamaYap(request);
        when(http.send(any())).thenReturn(new HookDeskHttpClient.Result(429, "", "120"));
        Instant before = Instant.now();
        dispatcher.dispatchOnce();
        HookDeskOutboxEvent event = outbox.findAll().get(0);
        assertThat(event.getStatus()).isEqualTo(HookDeskOutboxEvent.Status.PENDING);
        assertThat(event.getNextAttemptAt()).isAfter(before.plusSeconds(119));
        var claim = store.claimNext(event.getNextAttemptAt().plusSeconds(1)).orElseThrow();
        store.complete(claim, HookDeskOutboxEvent.Status.PENDING, null, null, Instant.now(), Instant.now().minusSeconds(1));
        when(http.send(any())).thenReturn(new HookDeskHttpClient.Result(401, "", null));
        dispatcher.dispatchOnce();
        assertThat(outbox.findAll().get(0).getStatus()).isEqualTo(HookDeskOutboxEvent.Status.FAILED);
        assertThat(outbox.findAll().get(0).getLastError()).isEqualTo("http_401");
    }

    @Test
    void acceptedEventRequiresValidContractAndMarksNoSubscriptionAsUnrouted() throws Exception {
        rentalService.kiralamaYap(request);
        when(http.send(any())).thenReturn(new HookDeskHttpClient.Result(202,
                "{\"data\":{\"id\":\"01ARZ3NDEKTSV4RRFFQ69G5FAV\",\"delivery_count\":0,\"routing_result\":\"no_matching_endpoints\"}}", null));
        dispatcher.dispatchOnce();
        HookDeskOutboxEvent event = outbox.findAll().get(0);
        assertThat(event.getStatus()).isEqualTo(HookDeskOutboxEvent.Status.UNROUTED);
        assertThat(event.getHookdeskEventId()).isEqualTo("01ARZ3NDEKTSV4RRFFQ69G5FAV");
        assertThat(store.claimNext(Instant.now().plusSeconds(60))).isEmpty();
    }

    @Test
    void routedAcceptanceStopsFurtherPostingAndInvalid202IsRetried() throws Exception {
        rentalService.kiralamaYap(request);
        when(http.send(any())).thenReturn(new HookDeskHttpClient.Result(202, "{}", null));
        dispatcher.dispatchOnce();
        HookDeskOutboxEvent event = outbox.findAll().get(0);
        assertThat(event.getLastError()).isEqualTo("invalid_acceptance_response");
        var claim = store.claimNext(event.getNextAttemptAt().plusSeconds(1)).orElseThrow();
        store.complete(claim, HookDeskOutboxEvent.Status.PENDING, null, null, Instant.now(), Instant.now().minusSeconds(1));
        when(http.send(any())).thenReturn(new HookDeskHttpClient.Result(202,
                "{\"data\":{\"id\":\"01ARZ3NDEKTSV4RRFFQ69G5FAV\",\"delivery_count\":1,\"routing_result\":\"routed\"}}", null));
        dispatcher.dispatchOnce();
        assertThat(outbox.findAll().get(0).getStatus()).isEqualTo(HookDeskOutboxEvent.Status.SENT);
        assertThat(dispatcher.dispatchOnce()).isFalse();
        verify(http, times(2)).send(any());
    }

    @Test
    void expiredIdempotencyWindowNeverCreatesAnotherRemoteEvent() {
        rentalService.kiralamaYap(request);
        assertThat(store.claimNext(Instant.now().plusSeconds(24 * 60 * 60))).isEmpty();
        HookDeskOutboxEvent event = outbox.findAll().get(0);
        assertThat(event.getStatus()).isEqualTo(HookDeskOutboxEvent.Status.FAILED);
        assertThat(event.getLastError()).isEqualTo("idempotency_window_expired");
        verifyNoInteractions(http);
    }

    @Test
    void retryAfterAcceptsHttpDatesCapsLongWaitsAndIgnoresInvalidValues() {
        Instant now = Instant.parse("2026-10-28T10:00:00Z");
        assertThat(HookDeskDispatcher.retryAfterSeconds("Wed, 28 Oct 2026 10:02:00 GMT", now)).isEqualTo(120);
        assertThat(HookDeskDispatcher.retryAfterSeconds("999999", now)).isEqualTo(3600);
        assertThat(HookDeskDispatcher.retryAfterSeconds("-10", now)).isZero();
        assertThat(HookDeskDispatcher.retryAfterSeconds("Wed, 28 Oct 2026 09:00:00 GMT", now)).isZero();
    }
}
