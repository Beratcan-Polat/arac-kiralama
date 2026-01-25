package com.arackiralama.servis;

import com.arackiralama.model.Arac;
import com.arackiralama.model.AracDurum;
import com.arackiralama.model.Kiralama;
import com.arackiralama.veritabani.AracRepository;
import com.arackiralama.veritabani.KiralamaRepository;
import com.arackiralama.veritabani.FiyatPolitikasiRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AracServis {

    private final AracRepository aracRepository;
    private final KiralamaRepository kiralamaRepository;

    private final FiyatPolitikasiRepository fiyatPolitikasiRepository;

    public AracServis(AracRepository aracRepository, KiralamaRepository kiralamaRepository,
            FiyatPolitikasiRepository fiyatPolitikasiRepository) {
        this.aracRepository = aracRepository;
        this.kiralamaRepository = kiralamaRepository;
        this.fiyatPolitikasiRepository = fiyatPolitikasiRepository;
    }

    // 1. Tüm araçları getir
    public List<Arac> tumAraclariGetir() {
        return aracRepository.findAll().stream()
                .filter(arac -> !arac.isSilindi())
                .filter(arac -> arac.getDurum() != AracDurum.ONAY_BEKLIYOR) // Onay bekleyenleri gizle
                .collect(Collectors.toList());
    }

    // İSTATİSTİK: Toplam araç sayısı (silinmemiş ve onay beklemeyenler)
    public long toplamAracSayisi() {
        return aracRepository.findAll().stream()
                .filter(arac -> !arac.isSilindi())
                .filter(arac -> arac.getDurum() != AracDurum.ONAY_BEKLIYOR)
                .count();
    }

    // 2. Sadece MÜSAİT olan araçları getir (HATA 1 Çözümü)
    public List<Arac> musaitAraclariGetir() {
        return aracRepository.findByDurum(AracDurum.MUSAIT);
    }

    // Konum ve tarih bazlı filtreleme
    public List<Arac> araclariFiltrele(String alisNoktasi, java.time.LocalDate baslangicTarihi,
            java.time.LocalDate bitisTarihi) {
        // HATA OLABİLİR: Sadece MUSAIT olanları değil, KIRADA olup da gelecekte müsait
        // olacakları da getir.
        return aracRepository.findAll().stream()
                .filter(arac -> !arac.isSilindi()) // Silinmişleri gizle
                .filter(arac -> arac.getDurum() != AracDurum.BAKIMDA) // Bakamdakileri gizle (Bakım süresi belirsizdir)
                .filter(arac -> arac.getDurum() != AracDurum.ONAY_BEKLIYOR) // Onay bekleyenleri gizle
                .filter(arac -> {
                    // Alış noktası filtresi (virgülle ayrılmış liste kontrol)
                    if (alisNoktasi != null && !alisNoktasi.isEmpty()) {
                        if (arac.getAlisNoktasi() == null) {
                            return false;
                        }
                        // Aracın alış noktalarında seçilen nokta var mı?
                        String[] aracNoktalar = arac.getAlisNoktasi().split(",");
                        boolean noktaBulundu = false;
                        for (String nokta : aracNoktalar) {
                            if (nokta.trim().equals(alisNoktasi.trim())) {
                                noktaBulundu = true;
                                break;
                            }
                        }
                        if (!noktaBulundu) {
                            return false;
                        }
                    }
                    // Tarih filtresi: Bu araç seçilen tarihlerde başka bir rezervasyonda mı?
                    if (baslangicTarihi != null && bitisTarihi != null) {
                        // Çakışan rezervasyon var mı kontrol et
                        List<Kiralama> cakisanKiralamalar = kiralamaRepository.findOverlappingBookings(
                                arac.getId(),
                                baslangicTarihi,
                                bitisTarihi);

                        // Çakışan rezervasyon varsa bu aracı gösterme
                        if (!cakisanKiralamalar.isEmpty()) {
                            return false;
                        }
                    }

                    return true;
                })
                .collect(Collectors.toList());
    }

    // 3. Yeni araç kaydet (HATA 2 Çözümü: void yerine Arac döndürüyor)
    // 3. Yeni araç kaydet
    public Arac aracKaydet(Arac arac) {
        // --- VALIDATION POLICY START ---
        if (arac.getAracSinifi() != null && arac.getGunlukFiyat() != null) {
            fiyatPolitikasiRepository.findByAracSinifi(arac.getAracSinifi()).ifPresent(politika -> {
                if (politika.getMinFiyat() != null
                        && arac.getGunlukFiyat().compareTo(politika.getMinFiyat()) < 0) {
                    throw new RuntimeException("Yönetici politikasına göre " + arac.getAracSinifi()
                            + " araçları en az " + politika.getMinFiyat() + " TL olmalıdır.");
                }
                if (politika.getMaxFiyat() != null
                        && arac.getGunlukFiyat().compareTo(politika.getMaxFiyat()) > 0) {
                    throw new RuntimeException("Yönetici politikasına göre " + arac.getAracSinifi()
                            + " araçları en fazla " + politika.getMaxFiyat() + " TL olmalıdır.");
                }
            });
        }
        // --- VALIDATION POLICY END ---

        // Eğer yeni bir araçsa (ID yoksa)
        if (arac.getId() == null) {
            // Mevcut kullanıcının rolünü kontrol et
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();

            boolean isAdmin = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (isAdmin) {
                // Admin ekliyorsa direkt MUSAIT olsun
                arac.setDurum(AracDurum.MUSAIT);
            } else {
                // Personel ekliyorsa ONAY_BEKLIYOR olsun
                arac.setDurum(AracDurum.ONAY_BEKLIYOR);
            }
        }

        return aracRepository.save(arac);
    }

    // YENİ: Araç Onaylama
    public void aracOnayla(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        Arac arac = aracRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Araç bulunamadı!"));
        arac.setDurum(AracDurum.MUSAIT);
        aracRepository.save(arac);
    }

    // YENİ: Onay Bekleyenleri Getir
    public List<Arac> onayBekleyenleriGetir() {
        return aracRepository.findAll().stream()
                .filter(arac -> !arac.isSilindi())
                .filter(arac -> arac.getDurum() == AracDurum.ONAY_BEKLIYOR)
                .collect(Collectors.toList());
    }

    // 4. ID ile tek araç getir
    public Arac idIleAracGetir(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        return aracRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Araç bulunamadı!"));
    }

    public String aracSil(Long id, boolean zorlaSil, String silinmeSebebi) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        Arac arac = aracRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Araç bulunamadı!"));

        // 1. KURAL: Araç KİRADA (Aktif) ise ASLA silinemez.
        if (kiralamaRepository.aracKiradaMi(id)) {
            // "Kirada (Aktif), Kesin Engel, Silme butonunu pasif yap veya uyar."
            throw new RuntimeException("DUR: Bu araç şu an müşteride (Aktif Kirada)! Teslim alınmadan silinemez.");
        }

        // 2. KURAL: Araç REZERVE (Gelecek) ise UYARI ver. (Koşullu Onay)
        if (kiralamaRepository.gelecekRezervasyonuVarMi(id)) {
            if (!zorlaSil) {
                // "Uyarı ver. Rezervasyonu ya iptal etmesini ya da başka araca aktarmasını
                // zorunlu kıl."
                throw new RuntimeException(
                        "UYARI: Bu araca ait ileri tarihli rezervasyonlar var! Silerseniz hepsi iptal olacak. Devam etmek istiyor musunuz?");
            }

            // Eğer zorlaSil = true geldiyse rezervasyonları iptal et
            List<Kiralama> rezervasyonlar = kiralamaRepository.gelecekRezervasyonlariGetir(id);
            for (Kiralama k : rezervasyonlar) {
                k.setDurum("IPTAL"); // Rezervasyonu iptal et
                kiralamaRepository.save(k);
            }
        }

        // 3. KURAL: Tüm silme işlemleri Soft Delete olmalı (Kayıt saklamak için)
        // Eski Kontrol: if (kiralamaRepository.existsByAracId(id)) { ... } else { hard
        // delete }
        // Yeni Mantık: Her zaman Soft Delete

        arac.setSilindi(true);
        arac.setSilinmeTarihi(java.time.LocalDateTime.now());
        arac.setSilinmeSebebi(
                silinmeSebebi != null && !silinmeSebebi.trim().isEmpty() ? silinmeSebebi : "Belirtilmedi");

        // Varsayılan olarak PASIF yapıyoruz
        arac.setDurum(AracDurum.PASIF);

        aracRepository.save(arac);
        return "Araç arşivlendi (Soft Delete). Durumu: PASIF.";
    }

    // 5. Eksik Açıklamaları Doldur (AI)

}
