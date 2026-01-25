package com.arackiralama.kontrol;

import com.arackiralama.model.Arac;
import com.arackiralama.servis.AracServis;
import com.arackiralama.servis.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIChatKontrol {

    private final GeminiService geminiService;
    private final AracServis aracServis;

    public AIChatKontrol(GeminiService geminiService, AracServis aracServis) {
        this.geminiService = geminiService;
        this.aracServis = aracServis;
    }

    /**
     * Araç önerisi
     * POST /api/ai/oner
     * Body: {"istek": "5 günlüğüne aile için uygun araç öner"}
     */
    @PostMapping("/oner")
    public ResponseEntity<?> aracOner(@RequestBody Map<String, String> requestBody) {
        try {
            String istek = requestBody.get("istek");
            if (istek == null || istek.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("hata", "İstek boş olamaz"));
            }

            String oneri = geminiService.aracOner(istek);
            return ResponseEntity.ok(Map.of("oneri", oneri));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("hata", e.getMessage()));
        }
    }

    /**
     * Müşteri destek sorusu
     * POST /api/ai/destek
     * Body: {"soru": "Depozito ne kadar?"}
     */
    @PostMapping("/destek")
    public ResponseEntity<?> destekSorusu(@RequestBody Map<String, String> requestBody) {
        try {
            String soru = requestBody.get("soru");
            if (soru == null || soru.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("hata", "Soru boş olamaz"));
            }

            String cevap = geminiService.destekSorusuCevapla(soru);
            return ResponseEntity.ok(Map.of("cevap", cevap));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("hata", e.getMessage()));
        }
    }
}
