package com.arackiralama.servis;

import com.arackiralama.model.Arac;
import com.arackiralama.model.AracDurum;
import com.arackiralama.model.Bakim;
import com.arackiralama.veritabani.AracRepository;
import com.arackiralama.veritabani.BakimRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class BakimServis {

    private final BakimRepository bakimRepository;
    private final AracRepository aracRepository;

    public BakimServis(BakimRepository bakimRepository, AracRepository aracRepository) {
        this.bakimRepository = bakimRepository;
        this.aracRepository = aracRepository;
    }

    // 1. Aracı bakıma al (Personel raporuyla)
    public void bakimaAl(Arac arac, String aciklama) {
        Bakim bakim = new Bakim();
        bakim.setArac(arac);
        bakim.setAciklama(aciklama);
        bakim.setBaslangicTarihi(LocalDate.now());
        bakim.setAktif(true);

        bakimRepository.save(bakim);

        // Araç durumunu güncelle
        arac.setDurum(AracDurum.BAKIMDA);
        aracRepository.save(arac);
    }

    // 2. Bakımı tamamla (Admin faturasıyla)
    public void bakimiTamamla(Long bakimId, BigDecimal masraf) {
        Bakim bakim = bakimRepository.findById(bakimId)
                .orElseThrow(() -> new RuntimeException("Bakım kaydı bulunamadı!"));

        bakim.setMasraf(masraf);
        bakim.setBitisTarihi(LocalDate.now());
        bakim.setAktif(false);
        bakimRepository.save(bakim);

        // Aracı tekrar MUSAIT yap
        Arac arac = bakim.getArac();
        arac.setDurum(AracDurum.MUSAIT);
        aracRepository.save(arac);
    }

    // 3. Aktif bakımları getir
    public List<Bakim> aktifBakimlariGetir() {
        return bakimRepository.findByAktifTrue();
    }

    // İSTATİSTİK: Bakımda olan araç sayısı
    public long bakimdaOlanAracSayisi() {
        return bakimRepository.findByAktifTrue().size();
    }

    // İSTATİSTİK: Toplam bakım masrafı
    public BigDecimal toplamBakimMasrafiHesapla() {
        return bakimRepository.findAll().stream()
                .filter(b -> b.getMasraf() != null)
                .map(Bakim::getMasraf)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Tüm bakım kayıtlarını getir
    public List<Bakim> tumBakimlariGetir() {
        return bakimRepository.findAll();
    }

    // MOBİL: Bakım tamamla (bakimiTamamla alias)
    public void bakimTamamla(Long bakimId, BigDecimal masraf) {
        bakimiTamamla(bakimId, masraf);
    }
}
