package com.arackiralama.kontrol;

import com.arackiralama.dto.KiralamaIstegi; // Bu importu ekledik (KiralamaIstegi için)
import com.arackiralama.model.Arac;
import com.arackiralama.servis.AracServis;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable; // EKSİK OLAN BUYDU
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class WebAracKontrol {

    private final AracServis aracServis;

    public WebAracKontrol(AracServis aracServis) {
        this.aracServis = aracServis;
    }

    // 1. Araç Listeleme (Alış noktası ve tarih ile)
    // 1. Araç Listeleme (Alış noktası ve tarih ile)
    // 1. Araç Listeleme (Alış noktası ve tarih ile)
    @GetMapping("/araclar")
    public String araclariListele(
            @RequestParam(required = false) String alisNoktasi,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate alisTarihi,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.TIME) java.time.LocalTime alisSaati,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate iadeTarihi,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.TIME) java.time.LocalTime iadeSaati,
            @RequestParam(defaultValue = "false") boolean tumunuGoster,
            Model model) {

        boolean aramaYapildi = false;

        // Kullanıcı rolünü kontrol et
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        boolean isAdminOrPersonel = auth != null && auth.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN") || r.getAuthority().equals("ROLE_PERSONEL"));

        // 1. Filtre varsa filtrele
        if (alisNoktasi != null && !alisNoktasi.isEmpty()) {
            model.addAttribute("aracListesi", aracServis.araclariFiltrele(alisNoktasi, alisTarihi, iadeTarihi));
            aramaYapildi = true;
        }
        // 2. Admin/Personel ise ve arama yoksa varsayılan olarak TÜMÜNÜ göster
        else if (isAdminOrPersonel || tumunuGoster) {
            // Admin sayfasında varsayılan olarak hepsi listelensin
            model.addAttribute("aracListesi", aracServis.tumAraclariGetir());
            aramaYapildi = true;
        }
        // 3. Müşteri ve arama yoksa liste BOŞ (Başlangıç ekranı)
        else {
            model.addAttribute("aracListesi", new java.util.ArrayList<>());
        }

        model.addAttribute("aramaYapildi", aramaYapildi);

        // Filtre değerlerini de gönder (formda seçili kalsın)
        model.addAttribute("secilenAlisNoktasi", alisNoktasi != null ? alisNoktasi : "");
        model.addAttribute("secilenAlisTarihi", alisTarihi);
        model.addAttribute("secilenAlisSaati", alisSaati);
        model.addAttribute("secilenIadeTarihi", iadeTarihi);
        model.addAttribute("secilenIadeSaati", iadeSaati);

        // Role göre farklı sayfa döndür
        if (isAdminOrPersonel) {
            return "admin-arac-listesi";
        } else {
            return "arac-listesi";
        }
    }

    // Ofisler Sayfası
    @GetMapping("/ofisler")
    public String ofisler() {
        return "ofisler";
    }

    // AI Asistan Sayfası
    @GetMapping("/ai-asistan")
    public String aiAsistan() {
        return "ai-asistan";
    }

    // 2. Araç Ekleme Sayfasını AÇ
    @GetMapping("/arac-ekle")
    public String aracEkleSayfasi(Model model) {
        model.addAttribute("arac", new Arac());
        return "arac-ekle";
    }

    // 3. Aracı Veritabanına KAYDET
    @PostMapping("/arac-ekle")
    public String aracKaydet(@ModelAttribute Arac arac, RedirectAttributes attributes) {
        try {
            aracServis.aracKaydet(arac);
            attributes.addFlashAttribute("mesaj", "Araç başarıyla kaydedildi.");
            return "redirect:/araclar";
        } catch (RuntimeException e) {
            attributes.addFlashAttribute("hata", e.getMessage());
            return "redirect:/arac-ekle";
        }
    }

    // 4. Araç Detay Sayfası
    @GetMapping("/arac-detay/{id}")
    public String aracDetay(@PathVariable Long id, Model model) {
        Arac arac = aracServis.idIleAracGetir(id);
        model.addAttribute("arac", arac);

        KiralamaIstegi istek = new KiralamaIstegi();
        istek.setAracId(id);
        model.addAttribute("kiralamaIstegi", istek);

        return "arac-detay";
    }

    // 5. Araç Silme İşlemi (GÜNCELLENDİ)
    @GetMapping("/arac-sil/{id}")
    public String aracSil(@PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean zorla,
            @RequestParam(required = false) String silinmeSebebi,
            RedirectAttributes attributes) {
        try {
            // Servise artık hem ID'yi hem de zorla parametresini gönderiyoruz
            String mesaj = aracServis.aracSil(id, zorla, silinmeSebebi);

            // Başarılı olursa mesajı göster
            attributes.addFlashAttribute("mesaj", mesaj);
            return "redirect:/araclar?silindi";

        } catch (RuntimeException e) {
            // Hata veya Uyarı durumunda (Örn: Rezervasyon var uyarısı)
            attributes.addFlashAttribute("hata", e.getMessage());

            // Eğer "UYARI" ise kullanıcıya bir ipucu bırakabiliriz
            if (e.getMessage().startsWith("UYARI")) {
                // Kullanıcıya "Evet, yine de sil" diyebileceği bir link oluşturmak için ID'yi
                // gönderiyoruz
                attributes.addFlashAttribute("uyariId", id);
            }
            return "redirect:/araclar";
        }
    }

    // 6. Araç Düzenleme Sayfası AÇ
    @GetMapping("/arac-duzenle/{id}")
    public String aracDuzenleSayfasi(@PathVariable Long id, Model model) {
        Arac arac = aracServis.idIleAracGetir(id);
        model.addAttribute("arac", arac);
        return "arac-duzenle";
    }

    // 7. Aracı Güncelle
    // 7. Aracı Güncelle
    @PostMapping("/arac-duzenle")
    public String aracGuncelle(@ModelAttribute Arac arac, RedirectAttributes attributes) {
        try {
            // Formdan gelen 'arac' nesnesi sadece formdaki inputları içerir, diğer alanlar
            // NULL olur.
            // Bu yüzden önce veritabanındaki orijinal kaydı çekiyoruz.
            Arac mevcutArac = aracServis.idIleAracGetir(arac.getId());

            // Değişiklikleri manuel olarak aktarıyoruz (Merge işlemi)
            mevcutArac.setMarka(arac.getMarka());
            mevcutArac.setModel(arac.getModel());
            // Plaka readonly ama yine de set edebiliriz
            mevcutArac.setPlaka(arac.getPlaka());
            mevcutArac.setAlisNoktasi(arac.getAlisNoktasi());
            mevcutArac.setGunlukFiyat(arac.getGunlukFiyat());
            mevcutArac.setYakitTipi(arac.getYakitTipi());
            mevcutArac.setVitesTipi(arac.getVitesTipi());
            mevcutArac.setAracSinifi(arac.getAracSinifi());
            mevcutArac.setKasaTipi(arac.getKasaTipi());

            // Limit ve Koşullar
            mevcutArac.setMinYas(arac.getMinYas());
            mevcutArac.setMinGencYas(arac.getMinGencYas());
            mevcutArac.setMinEhliyetYili(arac.getMinEhliyetYili());
            mevcutArac.setMinGencEhliyetYili(arac.getMinGencEhliyetYili());
            mevcutArac.setGunlukKmLimiti(arac.getGunlukKmLimiti());
            mevcutArac.setTeminatTutari(arac.getTeminatTutari());

            mevcutArac.setResimUrl(arac.getResimUrl());

            // ÖNEMLİ: Durum bilgisi formda yoksa null gelebilir.
            // Mevcut durumu KORUYORUZ. Eğer mevcut durum da null ise (veri bozulmuşsa)
            // varsayılan ata.
            if (mevcutArac.getDurum() == null) {
                mevcutArac.setDurum(com.arackiralama.model.AracDurum.MUSAIT);
            }

            aracServis.aracKaydet(mevcutArac);
            attributes.addFlashAttribute("mesaj", "Araç başarıyla güncellendi.");
            return "redirect:/araclar";
        } catch (RuntimeException e) {
            attributes.addFlashAttribute("hata", "Güncelleme hatası: " + e.getMessage());
            return "redirect:/arac-duzenle/" + arac.getId();
        }
    }

}