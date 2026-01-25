package com.arackiralama.servis;

import com.arackiralama.dto.KiralamaIstegi;
import com.arackiralama.model.Arac;
import com.arackiralama.model.Kiralama;
import com.arackiralama.model.Kullanici;
import com.arackiralama.veritabani.AracRepository;
import com.arackiralama.veritabani.KiralamaRepository;
import com.arackiralama.veritabani.KullaniciRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class KiralamaServis {

    private final KiralamaRepository kiralamaRepository;
    private final MailServis mailServis;
    private final AracRepository aracRepository;
    private final KullaniciRepository kullaniciRepository;
    private final BakimServis bakimServis;

    public KiralamaServis(KiralamaRepository kiralamaRepository, MailServis mailServis, AracRepository aracRepository,
            KullaniciRepository kullaniciRepository, BakimServis bakimServis) {
        this.kiralamaRepository = kiralamaRepository;
        this.mailServis = mailServis;
        this.aracRepository = aracRepository;
        this.kullaniciRepository = kullaniciRepository;
        this.bakimServis = bakimServis;
    }

    // Yeni Kiralama Yapma Metodu
    public Kiralama kiralamaYap(KiralamaIstegi istek) {
        // ... (Mevcut kod aynı)
        // 1. Tarih Kontrolü
        if (istek.getIadeTarihi().isBefore(istek.getAlisTarihi())) {
            throw new RuntimeException("İade tarihi, alış tarihinden önce olamaz!");
        }

        // 2. Araç ve Kullanıcıyı Bul
        if (istek.getAracId() == null) {
            throw new IllegalArgumentException("Araç seçimi yapılmalıdır!");
        }
        Arac arac = aracRepository.findById(istek.getAracId())
                .orElseThrow(() -> new RuntimeException("Araç bulunamadı!"));

        if (istek.getKullaniciId() == null) {
            throw new IllegalArgumentException("Kullanıcı bilgisi eksik!");
        }
        Kullanici kullanici = kullaniciRepository.findById(istek.getKullaniciId())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı!"));

        // 3. Çakışma Kontrolü
        List<Kiralama> cakismalar = kiralamaRepository.tarihCakisiyorMu(
                istek.getAracId(), istek.getAlisTarihi(), istek.getIadeTarihi());

        if (!cakismalar.isEmpty()) {
            throw new RuntimeException("Bu araç seçilen tarihlerde zaten kiralanmış!");
        }

        // 4. Fiyat Hesaplama
        long gunSayisi = ChronoUnit.DAYS.between(istek.getAlisTarihi(), istek.getIadeTarihi());
        if (gunSayisi == 0)
            gunSayisi = 1;

        BigDecimal toplamFiyat = arac.getGunlukFiyat().multiply(BigDecimal.valueOf(gunSayisi));

        // ONLINE ödemede %30 indirim uygula
        if (istek.getOdemeTipi() != null && istek.getOdemeTipi().contains("ONLINE")) {
            toplamFiyat = toplamFiyat.multiply(new BigDecimal("0.70"));
        }

        // 5. Kayıt İşlemi
        Kiralama kiralama = new Kiralama();
        kiralama.setArac(arac);
        kiralama.setKullanici(kullanici);
        kiralama.setAlisTarihi(istek.getAlisTarihi());
        kiralama.setAlisSaati(istek.getAlisSaati()); // YENİ
        kiralama.setIadeTarihi(istek.getIadeTarihi());
        kiralama.setIadeSaati(istek.getIadeSaati()); // YENİ
        kiralama.setToplamFiyat(toplamFiyat);
        kiralama.setDurum("REZERVE");

        Kiralama kaydedilenKiralama = kiralamaRepository.save(kiralama);

        // MAIL GÖNDERİMİ
        try {
            String mailIcerigi = "Sayın " + kullanici.getAd() + ",\n" +
                    "Rezervasyonunuz başarıyla alınmıştır.\n" +
                    "Araç: " + arac.getMarka() + " " + arac.getModel() + "\n" +
                    "Alış Tarihi: " + kaydedilenKiralama.getAlisTarihi() + "\n" +
                    "İade Tarihi: " + kaydedilenKiralama.getIadeTarihi() + "\n" +
                    "Toplam Tutar: " + kaydedilenKiralama.getToplamFiyat() + " TL";

            mailServis.mailGonder(kullanici.getEmail(), "Rezervasyon Onayı", mailIcerigi);
        } catch (Exception e) {
            System.err.println("Mail gönderilemedi: " + e.getMessage());
            // Mail gönderilemese bile rezervasyon iptal edilmemeli, o yüzden exception
            // yutulur (loglanır)
        }

        return kaydedilenKiralama;
    }

    public List<Kiralama> getKullaniciKiralamalari(Long kullaniciId) {
        return kiralamaRepository.findByKullaniciId(kullaniciId);
    }

    // YENİ: Aktif Kiralamaları Getir (Personel için)
    public List<Kiralama> aktifKiralamalariGetir() {
        return kiralamaRepository.findAll().stream()
                .filter(k -> "KIRADA".equals(k.getDurum()) || "TESLIM_EDILDI".equals(k.getDurum())) // TESLIM_EDILDI
                                                                                                    // müşteri aldı
                                                                                                    // demek
                .toList();
    }

    // YENİ: Bekleyen Rezervasyonları Getir (Personel için)
    public List<Kiralama> bekleyenRezervasyonlariGetir() {
        return kiralamaRepository.findByDurum("REZERVE");
    }

    // İSTATİSTİK: Aktif kiralama sayısı (müşteride olan araçlar)
    public long aktifKiralamaSayisi() {
        return kiralamaRepository.findAll().stream()
                .filter(k -> "TESLIM_EDILDI".equals(k.getDurum()))
                .count();
    }

    // İSTATİSTİK: Toplam gelir (tamamlanmış kiralamalar + gecikme ücretleri)
    public BigDecimal toplamGelirHesapla() {
        return kiralamaRepository.findAll().stream()
                .filter(k -> "TESLIM_ALINDI".equals(k.getDurum())) // Tamamlanmış kiralamalar
                .map(k -> {
                    BigDecimal toplamFiyat = k.getToplamFiyat() != null ? k.getToplamFiyat() : BigDecimal.ZERO;
                    BigDecimal ekUcret = k.getEkUcret() != null ? k.getEkUcret() : BigDecimal.ZERO;
                    return toplamFiyat.add(ekUcret);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Tamamlanmış kiralamaları getir (ciro raporu için)
    public List<Kiralama> tamamlanmisKiralamalariGetir() {
        return kiralamaRepository.findAll().stream()
                .filter(k -> "TESLIM_ALINDI".equals(k.getDurum()))
                .toList();
    }

    // YENİ: Gecikme Hesaplama
    public void gecikmeHesapla(Long kiralamaId) {
        if (kiralamaId == null) {
            throw new IllegalArgumentException("Kiralama ID boş olamaz!");
        }
        Kiralama kiralama = kiralamaRepository.findById(kiralamaId)
                .orElseThrow(() -> new RuntimeException("Kiralama bulunamadı!"));

        LocalDate bugun = java.time.LocalDate.now();
        LocalDate iadeTarihi = kiralama.getIadeTarihi();

        // Gecikme kontrolü
        if (bugun.isAfter(iadeTarihi)) {
            long gecikmeGun = java.time.temporal.ChronoUnit.DAYS.between(iadeTarihi, bugun);
            kiralama.setGecikmeGunSayisi((int) gecikmeGun);

            // Ek ücret hesaplama: günlükFiyat × 1.5 × gecikmeGünü
            BigDecimal gunlukFiyat = kiralama.getArac().getGunlukFiyat();
            BigDecimal cezaKatsayisi = new BigDecimal("1.5");
            BigDecimal ekUcret = gunlukFiyat.multiply(cezaKatsayisi)
                    .multiply(BigDecimal.valueOf(gecikmeGun))
                    .setScale(2, java.math.RoundingMode.HALF_UP); // 2 basamak yuvarla
            kiralama.setEkUcret(ekUcret);
        } else {
            // Gecikmesiz
            kiralama.setGecikmeGunSayisi(0);
            kiralama.setEkUcret(BigDecimal.ZERO);
        }

        kiralamaRepository.save(kiralama);
    }

    // YENİ: Aracı Müşteriye Teslim Etme İşlemi (Kiralama Başlatma)
    public void araciTeslimEt(Long kiralamaId) {
        if (kiralamaId == null) {
            throw new IllegalArgumentException("Kiralama ID boş olamaz!");
        }
        Kiralama kiralama = kiralamaRepository.findById(kiralamaId)
                .orElseThrow(() -> new RuntimeException("Rezervasyon bulunamadı!"));

        kiralama.setDurum("TESLIM_EDILDI"); // Artık resmen kirada
        kiralamaRepository.save(kiralama);

        Arac arac = kiralama.getArac();
        arac.setDurum(com.arackiralama.model.AracDurum.KIRADA); // Araç durumunu KIRADA yap
        aracRepository.save(arac);

        // MAIL GÖNDERİMİ (Kiralama Başladı)
        try {
            String mailIcerigi = "Sayın " + kiralama.getKullanici().getAd() + ",\n" +
                    "Aracı teslim aldınız. İyi yolculuklar dileriz.\n\n" +
                    "Araç: " + arac.getMarka() + " " + arac.getModel() + "\n" +
                    "Plaka: " + arac.getPlaka() + "\n" +
                    "Teslim Alma Tarihi: " + java.time.LocalDate.now() + "\n\n" +
                    "Herhangi bir sorunda bizimle iletişime geçebilirsiniz.";

            mailServis.mailGonder(kiralama.getKullanici().getEmail(), "Kiralama Başladı - İyi Yolculuklar",
                    mailIcerigi);
        } catch (Exception e) {
            System.err.println("Teslim etme maili gönderilemedi: " + e.getMessage());
        }
    }

    // YENİ: İade Alma İşlemi
    public void iadeAl(Long kiralamaId, boolean hasarli, String hasarAciklamasi) {
        if (kiralamaId == null) {
            throw new IllegalArgumentException("Kiralama ID boş olamaz!");
        }
        Kiralama kiralama = kiralamaRepository.findById(kiralamaId)
                .orElseThrow(() -> new RuntimeException("Kiralama bulunamadı!"));

        // Gecikme hesaplama yap
        gecikmeHesapla(kiralamaId);

        // Gerçek iade tarihini kaydet
        kiralama.setGercekIadeTarihi(java.time.LocalDate.now());
        kiralama.setDurum("TESLIM_ALINDI"); // Kiralama bitti
        kiralamaRepository.save(kiralama);

        Arac arac = kiralama.getArac();

        if (hasarli) {
            // Bakım kaydı oluştur ve aracı bakıma al
            bakimServis.bakimaAl(arac, hasarAciklamasi);
        } else {
            // Araç temiz, tekrar müsait
            arac.setDurum(com.arackiralama.model.AracDurum.MUSAIT);
            aracRepository.save(arac);
        }

        // MAIL GÖNDERİMİ (Fatura ve Teslim Alma)
        try {
            BigDecimal kiralamaBedeli = kiralama.getToplamFiyat();
            BigDecimal gecikmeBedeli = kiralama.getEkUcret() != null ? kiralama.getEkUcret() : BigDecimal.ZERO;
            BigDecimal genelToplam = kiralamaBedeli.add(gecikmeBedeli);

            String hasarMesaji = hasarli ? "VAR (" + hasarAciklamasi + ")" : "YOK";

            String mailIcerigi = "Sayın " + kiralama.getKullanici().getAd() + ",\n" +
                    "Aracınız başarıyla teslim alınmıştır. Kiralama işleminiz tamamlanmıştır.\n\n" +
                    "--- FATURA ÖZETİ ---\n" +
                    "Araç: " + arac.getMarka() + " " + arac.getModel() + "\n" +
                    "Plaka: " + arac.getPlaka() + "\n" +
                    "Teslim Alma Tarihi: " + java.time.LocalDate.now() + "\n" +
                    "--------------------\n" +
                    "Kiralama Bedeli: " + kiralamaBedeli + " TL\n" +
                    "Gecikme Bedeli:  " + gecikmeBedeli + " TL\n" +
                    "Hasar Durumu:    " + hasarMesaji + "\n" +
                    "--------------------\n" +
                    "GENEL TOPLAM:    " + genelToplam + " TL\n\n" +
                    "Bizi tercih ettiğiniz için teşekkür ederiz.";

            mailServis.mailGonder(kiralama.getKullanici().getEmail(), "Kiralama Faturası ve Teslim Tutanağı",
                    mailIcerigi);
        } catch (Exception e) {
            System.err.println("İade maili gönderilemedi: " + e.getMessage());
        }
    }

    // YENİ: Kullanıcı Geçmişi
    public List<Kiralama> getirKullaniciKiralamalari(Long kullaniciId) {
        return kiralamaRepository.findByKullaniciId(kullaniciId);
    }

    // MOBİL: Toplam ciro hesapla
    public BigDecimal toplamCiroHesapla() {
        return toplamGelirHesapla();
    }

    // MOBİL: Aylık ciro hesapla
    public BigDecimal aylikCiroHesapla() {
        LocalDate ayBaslangic = LocalDate.now().withDayOfMonth(1);
        return kiralamaRepository.findAll().stream()
                .filter(k -> "TESLIM_ALINDI".equals(k.getDurum()))
                .filter(k -> k.getGercekIadeTarihi() != null && !k.getGercekIadeTarihi().isBefore(ayBaslangic))
                .map(k -> {
                    BigDecimal toplamFiyat = k.getToplamFiyat() != null ? k.getToplamFiyat() : BigDecimal.ZERO;
                    BigDecimal ekUcret = k.getEkUcret() != null ? k.getEkUcret() : BigDecimal.ZERO;
                    return toplamFiyat.add(ekUcret);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // MOBİL: Toplam kiralama sayısı
    public long toplamKiralamaSayisi() {
        return kiralamaRepository.count();
    }

    // MOBİL: Teslim et (araciTeslimEt alias)
    public void teslimEt(Long kiralamaId) {
        araciTeslimEt(kiralamaId);
    }

    // YENİ: Kiralama İptal Etme (Müşteri için)
    public void kiralamaIptalEt(Long kiralamaId) {
        if (kiralamaId == null) {
            throw new IllegalArgumentException("Kiralama ID boş olamaz!");
        }
        Kiralama kiralama = kiralamaRepository.findById(kiralamaId)
                .orElseThrow(() -> new RuntimeException("Kiralama bulunamadı!"));

        // Sadece REZERVE veya ONAY_BEKLIYOR durumundaysa iptal edilebilir
        if (!"REZERVE".equals(kiralama.getDurum()) && !"ONAY_BEKLIYOR".equals(kiralama.getDurum())) {
            throw new RuntimeException("Sadece rezervasyon aşamasındaki araçlar iptal edilebilir!");
        }

        kiralama.setDurum("IPTAL");
        kiralamaRepository.save(kiralama);
    }

    // MOBİL: Rezervasyonları getir
    public List<Kiralama> rezervasyonlariGetir() {
        return bekleyenRezervasyonlariGetir();
    }
}