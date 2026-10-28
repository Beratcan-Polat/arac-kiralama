package com.arackiralama.hookdesk;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class HookDeskHttpClientTest {
    @Test
    void responseBodyThatStallsAfterHeadersStillHasAnOverallDeadline() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var executor = Executors.newCachedThreadPool();
        server.setExecutor(executor);
        server.createContext("/api/v1/events", exchange -> {
            exchange.getRequestBody().readAllBytes();
            exchange.sendResponseHeaders(202, 4096);
            exchange.getResponseBody().write('{');
            exchange.getResponseBody().flush();
            try { Thread.sleep(15000); }
            catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
            finally { exchange.close(); }
        });
        server.start();
        try {
            HookDeskProperties properties = new HookDeskProperties();
            properties.setApiKey("hd_test_key");
            properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
            var claim = new HookDeskOutboxStore.Claim("row", "{}", "rental.created:row", "lease", 1, Instant.now().plusSeconds(3600));
            long started = System.nanoTime();
            assertThatThrownBy(() -> new HookDeskHttpClient(properties).send(claim)).isInstanceOf(java.io.IOException.class);
            assertThat(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started)).isLessThan(13000);
        } finally { server.stop(0); executor.shutdownNow(); }
    }

    @Test
    void sendsImmutableBytesBearerAndIdempotencyHeaderWithoutFollowingRedirects() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        AtomicReference<String> bytes = new AtomicReference<>();
        AtomicReference<String> key = new AtomicReference<>();
        AtomicReference<String> auth = new AtomicReference<>();
        server.createContext("/api/v1/events", exchange -> {
            bytes.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            key.set(exchange.getRequestHeaders().getFirst("Idempotency-Key"));
            auth.set(exchange.getRequestHeaders().getFirst("Authorization"));
            exchange.getResponseHeaders().add("Location", "/unexpected");
            exchange.sendResponseHeaders(302, -1); exchange.close();
        });
        server.start();
        try {
            HookDeskProperties properties = new HookDeskProperties();
            properties.setEnabled(true); properties.setApiKey("hd_test_key");
            properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
            String body = "{\"type\":\"rental.created\",\"data\":{\"name\":\"Türkçe\"}}";
            var claim = new HookDeskOutboxStore.Claim("row", body, "rental.created:row", "lease", 1, Instant.now().plusSeconds(3600));
            HookDeskHttpClient.Result result = new HookDeskHttpClient(properties).send(claim);
            assertThat(result.status()).isEqualTo(302);
            assertThat(bytes.get()).isEqualTo(body);
            assertThat(key.get()).isEqualTo("rental.created:row");
            assertThat(auth.get()).isEqualTo("Bearer hd_test_key");
        } finally { server.stop(0); }
    }
}
