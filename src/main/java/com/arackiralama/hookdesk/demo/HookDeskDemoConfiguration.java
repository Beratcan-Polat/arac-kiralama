package com.arackiralama.hookdesk.demo;

import com.arackiralama.model.Arac;
import com.arackiralama.model.AracDurum;
import com.arackiralama.model.Kullanici;
import com.arackiralama.model.Rol;
import com.arackiralama.veritabani.AracRepository;
import com.arackiralama.veritabani.KullaniciRepository;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

/** Ayrı demo profili dışında kullanıcı veya araç oluşturmaz. */
@Configuration
@Profile("hookdesk-demo")
public class HookDeskDemoConfiguration {
    @Bean
    CommandLineRunner hookDeskDemoData(KullaniciRepository users, AracRepository vehicles,
            PasswordEncoder encoder, TransactionTemplate transaction,
            @Value("${spring.datasource.url}") String databaseUrl,
            @Value("${hookdesk.demo.email}") String email,
            @Value("${hookdesk.demo.password}") String password) {
        if (!databaseUrl.startsWith("jdbc:mysql://mysql:3306/rental_hookdesk_demo?")) {
            throw new IllegalStateException("HookDesk demo requires its isolated database");
        }
        return args -> transaction.executeWithoutResult(status -> {
            if (users.findByEmail(email).isEmpty()) {
                users.save(new Kullanici("Demo Müşteri", email, encoder.encode(password), Rol.MUSTERI));
            }
            if (vehicles.count() == 0) {
                Arac vehicle = new Arac();
                vehicle.setMarka("Renault");
                vehicle.setModel("Clio");
                vehicle.setPlaka("02 HD 001");
                vehicle.setIl("Adıyaman");
                vehicle.setAlisNoktasi("Adıyaman Havalimanı");
                vehicle.setGunlukFiyat(new BigDecimal("1500.00"));
                vehicle.setYakitTipi("Benzin");
                vehicle.setVitesTipi("Otomatik");
                vehicle.setAracSinifi("Ekonomi");
                vehicle.setKasaTipi("Hatchback");
                vehicle.setMinYas(21);
                vehicle.setMinGencYas(19);
                vehicle.setMinEhliyetYili(2);
                vehicle.setMinGencEhliyetYili(1);
                vehicle.setGunlukKmLimiti(400);
                vehicle.setTeminatTutari(5000);
                vehicle.setResimUrl("/images/default-car.jpg");
                vehicle.setDurum(AracDurum.MUSAIT);
                vehicles.save(vehicle);
            }
            // Keep existing isolated demos usable through the customer's location selector.
            vehicles.findAll().stream()
                    .filter(vehicle -> "02 HD 001".equals(vehicle.getPlaka()))
                    .filter(vehicle -> "Merkez ofis".equals(vehicle.getAlisNoktasi()))
                    .forEach(vehicle -> {
                        vehicle.setAlisNoktasi("Adıyaman Havalimanı");
                        vehicles.save(vehicle);
                    });
        });
    }
}
