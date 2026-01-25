package com.arackiralama.servis;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.HashMap;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    /**
     * Gemini API'ye istek gönder ve yanıt al
     */
    public String generateText(String prompt) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "API key yapılandırılmamış. Lütfen application.properties dosyasına gemini.api.key ekleyin.";
        }

        try {
            // Request body oluştur
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, String> part = new HashMap<>();
            part.put("text", prompt);
            content.put("parts", new Object[] { part });
            requestBody.put("contents", new Object[] { content });

            // HTTP headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // API çağrısı
            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_API_URL + apiKey,
                    entity,
                    String.class);

            // Yanıtı parse et
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode content_node = candidates.get(0).path("content");
                JsonNode parts = content_node.path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    return parts.get(0).path("text").asText();
                }
            }

            return "Gemini'den yanıt alınamadı.";

        } catch (Exception e) {
            return "Hata: " + e.getMessage();
        }
    }

    /**
     * Araç için açıklama oluştur
     */

    /**
     * Araç önerisi sun
     */
    public String aracOner(String kullaniciIstegi) {
        String prompt = String.format(
                "Bir araç kiralama müşterisi şunu istiyor: '%s'. " +
                        "Ona hangi tip araç önerebiliriz? (Segment, kasa tipi, özellikler vb. belirt). " +
                        "Kısa ve net öner.",
                kullaniciIstegi);
        return generateText(prompt);
    }

    /**
     * Müşteri destek sorusuna cevap ver
     */
    public String destekSorusuCevapla(String soru) {
        String prompt = String.format(
                "Araç kiralama müşterisi şunu soruyor: '%s'. " +
                        "Profesyonel ve yardımcı bir müşteri temsilcisi gibi cevap ver. " +
                        "Standart depozito 500-1000 TL arasıdır. Gecikme durumunda günlük kiralama bedelinin 2 katı ücret alınır.",
                soru);
        return generateText(prompt);
    }
}
