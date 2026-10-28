package com.arackiralama.hookdesk;

import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Flow;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.springframework.stereotype.Component;

@Component
public class HookDeskHttpClient {
    public record Result(int status, String body, String retryAfter) {}
    private final HookDeskProperties properties;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
            .followRedirects(HttpClient.Redirect.NEVER).build();

    public HookDeskHttpClient(HookDeskProperties properties) { this.properties = properties; }

    public Result send(HookDeskOutboxStore.Claim claim) throws IOException, InterruptedException {
        URI uri = URI.create(properties.getBaseUrl().replaceAll("/+$", "") + "/api/v1/events");
        HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + properties.getApiKey())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Idempotency-Key", claim.idempotencyKey())
                .POST(HttpRequest.BodyPublishers.ofString(claim.body(), StandardCharsets.UTF_8)).build();
        CompletableFuture<HttpResponse<String>> pending = http.sendAsync(request, info -> new LimitedBodySubscriber());
        try {
            // The explicit deadline covers stalled response bodies as well as headers/connect.
            HttpResponse<String> response = pending.get(10, TimeUnit.SECONDS);
            return new Result(response.statusCode(), response.body(), response.headers().firstValue("Retry-After").orElse(null));
        } catch (TimeoutException e) {
            pending.cancel(true);
            throw new IOException("Acceptance request exceeded deadline");
        } catch (ExecutionException e) {
            if (e.getCause() instanceof IOException io) throw io;
            throw new IOException("Acceptance request failed");
        } catch (InterruptedException e) {
            pending.cancel(true);
            throw e;
        }
    }

    // Bound the response while receiving it, before parsing or allocating an unbounded body.
    private static class LimitedBodySubscriber implements HttpResponse.BodySubscriber<String> {
        private final CompletableFuture<String> body = new CompletableFuture<>();
        private final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        private Flow.Subscription subscription;

        @Override public CompletionStage<String> getBody() { return body; }
        @Override public void onSubscribe(Flow.Subscription subscription) {
            this.subscription = subscription;
            subscription.request(1);
        }
        @Override public void onNext(List<ByteBuffer> buffers) {
            for (ByteBuffer buffer : buffers) {
                if (bytes.size() + buffer.remaining() > 16384) {
                    subscription.cancel();
                    body.completeExceptionally(new IOException("Acceptance response exceeded limit"));
                    return;
                }
                byte[] chunk = new byte[buffer.remaining()];
                buffer.get(chunk);
                bytes.writeBytes(chunk);
            }
            subscription.request(1);
        }
        @Override public void onError(Throwable error) { body.completeExceptionally(error); }
        @Override public void onComplete() { body.complete(bytes.toString(StandardCharsets.UTF_8)); }
    }
}
