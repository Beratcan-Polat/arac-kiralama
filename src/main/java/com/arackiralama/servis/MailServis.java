package com.arackiralama.servis;

import com.arackiralama.dto.MailDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class MailServis {

    private final WebClient webClient;
    private final String mailServiceUrl;

    // WebClient.Builder Spring tarafından otomatik enjekte edilir
    public MailServis(WebClient.Builder webClientBuilder, @Value("${mail.service.url}") String mailServiceUrl) {
        this.webClient = webClientBuilder.build();
        this.mailServiceUrl = mailServiceUrl;
    }

    public void mailGonder(String email, String baslik, String mesaj) {
        MailDTO dto = new MailDTO();
        dto.setEmail(email);
        dto.setBaslik(baslik);
        dto.setMesaj(mesaj);

        // Asenkron olarak Python servisine POST isteği atar
        webClient.post()
                .uri(mailServiceUrl + "/send-mail")
                .bodyValue(dto)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(res -> System.out.println("MAIL GÖNDERİLDİ: " + res))
                .doOnError(err -> System.err.println("MAIL HATASI: " + err.getMessage()))
                .subscribe();
    }
}