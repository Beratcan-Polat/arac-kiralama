package com.arackiralama.config;

import com.arackiralama.model.Arac;
import com.arackiralama.model.AracDurum;
import com.arackiralama.veritabani.AracRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class VeriOnarici implements CommandLineRunner {

    private final AracRepository aracRepository;

    public VeriOnarici(AracRepository aracRepository) {
        this.aracRepository = aracRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- Veri Onarıcı Başlatıldı ---");

        // Durumu NULL olan araçları bul ve düzelt
        List<Arac> tumAraclar = aracRepository.findAll();
        boolean degisiklikYapildi = false;

        for (Arac arac : tumAraclar) {
            if (arac.getDurum() == null) {
                System.out.println("Hatalı Araç Tespit Edildi (ID: " + arac.getId()
                        + "): Durum NULL. 'MUSAIT' olarak düzeltiliyor...");
                arac.setDurum(AracDurum.MUSAIT);
                aracRepository.save(arac);
                degisiklikYapildi = true;
            }
        }

        if (degisiklikYapildi) {
            System.out.println("--- Bozuk veriler onarıldı ---");
        } else {
            System.out.println("--- Onarılacak veri bulunamadı, her şey yolunda ---");
        }
    }
}
