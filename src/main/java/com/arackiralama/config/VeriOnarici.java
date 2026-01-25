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
        System.out.println("--- VERİ ONARICI BAŞLATILDI ---");

        // Veritabanındaki tüm araçları ham olarak çek
        List<Arac> tumAraclar = aracRepository.findAll();

        int duzeltilenSayisi = 0;

        for (Arac arac : tumAraclar) {
            boolean degisiklikVar = false;

            // 1. Durum NULL ise MUSAIT yap (Listelerde görünmesi için)
            if (arac.getDurum() == null) {
                System.out.println("ONARILIYOR: Araç ID " + arac.getId() + " durumu NULL bulundu. MUSAIT yapılıyor.");
                arac.setDurum(AracDurum.MUSAIT);
                degisiklikVar = true;
            }

            // 2. Silindi NULL ise FALSE yap
            // (boolean primitive ise zaten false olur ama wrapper ise null olabilir,
            // modelde boolean primitive 'private boolean silindi = false;' gördük, yani
            // sorun yok.
            // Ama yine de JPA yüklerken sorun olabilir diye bakıyoruz)

            if (degisiklikVar) {
                aracRepository.save(arac);
                duzeltilenSayisi++;
            }
        }

        if (duzeltilenSayisi > 0) {
            System.out.println("--- VERİ ONARIM TAMAMLANDI: " + duzeltilenSayisi + " araç düzeltildi. ---");
        } else {
            System.out.println("--- VERİ ONARIM: Düzeltilecek kayıt bulunamadı. ---");
        }
    }
}
