package com.arackiralama.hookdesk;

import com.arackiralama.model.Kiralama;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HookDeskOutbox {
    private final HookDeskOutboxRepository repository;
    private final ObjectMapper json;
    private final HookDeskProperties properties;

    public HookDeskOutbox(HookDeskOutboxRepository repository, ObjectMapper json, HookDeskProperties properties) {
        this.repository = repository;
        this.json = json;
        this.properties = properties;
    }

    public boolean isEnabled() { return properties.isEnabled(); }

    // The caller must already be in the rental transaction; a separate save would lose atomicity.
    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(Kiralama rental) {
        if (!properties.isEnabled()) throw new IllegalStateException("HookDesk integration is disabled");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("rental_id", rental.getId());
        Map<String, Object> customer = new LinkedHashMap<>();
        customer.put("name", displayName(rental.getKullanici().getAd(), "Müşterimiz"));
        customer.put("email", rental.getKullanici().getEmail());
        data.put("customer", customer);
        Map<String, Object> vehicle = new LinkedHashMap<>();
        vehicle.put("brand", displayName(rental.getArac().getMarka(), "Belirtilmedi"));
        vehicle.put("model", displayName(rental.getArac().getModel(), "Belirtilmedi"));
        vehicle.put("plate", rental.getArac().getPlaka());
        data.put("vehicle", vehicle);
        data.put("pickup_date", rental.getAlisTarihi().toString());
        data.put("return_date", rental.getIadeTarihi().toString());
        data.put("total_price", rental.getToplamFiyat().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString());
        data.put("currency", "TRY");
        try {
            String body = json.writeValueAsString(Map.of("type", "rental.created", "data", data));
            if (body.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 60 * 1024) {
                // Leave space below MySQL TEXT's 65,535-byte limit; reservation data is normally a few KiB.
                throw new IllegalStateException("Rental event exceeds outbox body limit");
            }
            repository.save(new HookDeskOutboxEvent(rental.getId(), body, Instant.now()));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Rental event could not be serialized");
        }
    }

    private static String displayName(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
