package com.arackiralama.kontrol;

import com.arackiralama.dto.KiralamaIstegi;
import com.arackiralama.model.Arac;
import com.arackiralama.model.Kiralama; // EKSİK OLAN BUYDU
import com.arackiralama.model.Kullanici;
import com.arackiralama.servis.KiralamaServis;
import com.arackiralama.veritabani.AracRepository;
import com.arackiralama.veritabani.KullaniciRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List; // EKSİK OLAN BUYDU

import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import jakarta.servlet.http.HttpSession;

@Controller
public class WebKiralamaKontrol {

    private final KiralamaServis kiralamaServis;
    private final AracRepository aracRepository;
    private final KullaniciRepository kullaniciRepository;

    public WebKiralamaKontrol(KiralamaServis kiralamaServis, AracRepository aracRepository,
            KullaniciRepository kullaniciRepository) {
        this.kiralamaServis = kiralamaServis;
        this.aracRepository = aracRepository;
        this.kullaniciRepository = kullaniciRepository;
    }

    // 1. Kiralama Sayfasını AÇ (GET)
    @GetMapping("/kiralama-yap/{aracId}")
    public String kiralamaSayfasi(@PathVariable Long aracId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate alisTarihi,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.TIME) java.time.LocalTime alisSaati,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate iadeTarihi,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.TIME) java.time.LocalTime iadeSaati,
            Model model) {
        if (aracId == null) {
            throw new IllegalArgumentException("Araç ID boş olamaz");
        }
        Arac arac = aracRepository.findById(aracId).orElseThrow(() -> new RuntimeException("Araç yok"));
        model.addAttribute("arac", arac);

        KiralamaIstegi istek = new KiralamaIstegi();
        istek.setAracId(aracId);

        // Tarihler geldiyse doldur
        if (alisTarihi != null) {
            istek.setAlisTarihi(alisTarihi);
        }
        if (alisSaati != null) {
            istek.setAlisSaati(alisSaati);
        } else {
            // Varsayılan saat
            istek.setAlisSaati(java.time.LocalTime.of(10, 0));
        }

        if (iadeTarihi != null) {
            istek.setIadeTarihi(iadeTarihi);
        }
        if (iadeSaati != null) {
            istek.setIadeSaati(iadeSaati);
        } else {
            // Varsayılan saat
            istek.setIadeSaati(java.time.LocalTime.of(10, 0));
        }

        model.addAttribute("kiralamaIstegi", istek);

        return "arac-kirala";
    }

    // 2. Kiralama İşlemini KAYDET (POST)
    @PostMapping("/kiralama-yap")
    public String kiralamaTamamla(@ModelAttribute KiralamaIstegi istek,
            @RequestParam("odemeDurumu") String odemeDurumu, // Yeni parametre
            Principal principal, Model model, RedirectAttributes redirectAttributes) { // Yeni parametre

        String email = principal.getName();
        Kullanici kullanici = kullaniciRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        istek.setKullaniciId(kullanici.getId());

        if ("ONLINE".equals(odemeDurumu)) {
            // Ödeme sayfasına yönlendir (Kart Bilgileri İçin)
            // Kiralama isteğini Session veya FlashAttribute ile taşı
            redirectAttributes.addFlashAttribute("kiralamaIstegi", istek);
            return "redirect:/odeme";
        }

        // OFISTE ise direkt kaydet
        try {
            istek.setOdemeTipi("OFISTE");
            kiralamaServis.kiralamaYap(istek);
            return "redirect:/kiralamalarim?basarili";
        } catch (RuntimeException e) { // Exception yerine RuntimeException
            model.addAttribute("hata", e.getMessage());
            // Hata durumunda araç bilgisini tekrar yükle
            Arac arac = aracRepository.findById(istek.getAracId()).orElse(null);
            model.addAttribute("arac", arac);
            model.addAttribute("kiralamaIstegi", istek); // İstek objesini de geri gönder
            return "arac-kirala";
        }
    }

    // 3. Geçmiş Kiralamalarım Sayfası (YENİ)
    @GetMapping("/kiralamalarim")
    public String kiralamalarim(Principal principal, Model model) {
        String email = principal.getName();
        Kullanici kullanici = kullaniciRepository.findByEmail(email).orElseThrow();

        // Hata veren yer burasıydı, şimdi importlar sayesinde çalışacak
        List<Kiralama> kiralamalar = kiralamaServis.getirKullaniciKiralamalari(kullanici.getId());

        model.addAttribute("kiralamalar", kiralamalar);

        return "kiralamalarim";
    }

    // 4. Ödeme Sayfası (GET)
    @GetMapping("/odeme")
    public String odemeSayfasi(@ModelAttribute("kiralamaIstegi") KiralamaIstegi istek, Model model,
            HttpSession session) {
        // Eğer FlashAttribute boş gelirse Session'dan kurtarmayı dene
        if (istek.getAracId() == null) {
            KiralamaIstegi sessionIstek = (KiralamaIstegi) session.getAttribute("bekleyenKiralama");
            if (sessionIstek != null) {
                istek = sessionIstek;
            } else {
                return "redirect:/araclar";
            }
        } else {
            // FlashAttribute ile geldiyse Session'a yedekle (Refresh durumu için)
            session.setAttribute("bekleyenKiralama", istek);
        }

        Arac arac = aracRepository.findById(istek.getAracId()).orElse(null);
        if (arac == null)
            return "redirect:/araclar";

        // Fiyat Hesapla
        long gunSayisi = java.time.temporal.ChronoUnit.DAYS.between(istek.getAlisTarihi(), istek.getIadeTarihi());
        if (gunSayisi < 1)
            gunSayisi = 1;
        java.math.BigDecimal toplamTutar = arac.getGunlukFiyat().multiply(java.math.BigDecimal.valueOf(gunSayisi));

        model.addAttribute("kiralamaIstegi", istek);
        model.addAttribute("toplamTutar", toplamTutar);
        model.addAttribute("kiralamaIstegiJson", "ID:" + istek.getAracId());

        return "odeme";
    }

    // 5. Ödemeyi Tamamla (POST)
    @PostMapping("/odeme-yap")
    public String odemeYap(Principal principal, HttpSession session, RedirectAttributes redirectAttributes) {

        KiralamaIstegi sessionIstek = (KiralamaIstegi) session.getAttribute("bekleyenKiralama");

        if (sessionIstek == null) {
            redirectAttributes.addFlashAttribute("hata", "Ödeme oturumu zaman aşımına uğradı, lütfen tekrar deneyin.");
            return "redirect:/araclar";
        }

        try {
            String email = principal.getName();
            Kullanici kullanici = kullaniciRepository.findByEmail(email).orElseThrow();

            sessionIstek.setKullaniciId(kullanici.getId());
            sessionIstek.setOdemeTipi("ONLINE (Kredi Kartı)");

            kiralamaServis.kiralamaYap(sessionIstek);

            session.removeAttribute("bekleyenKiralama");

            return "redirect:/kiralamalarim?basarili";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Ödeme alınamadı: " + e.getMessage());
            return "redirect:/odeme";
        }
    }

    // 6. Kiralama İptal (POST)
    @PostMapping("/kiralama-iptal")
    public String kiralamaIptal(@RequestParam Long id, RedirectAttributes redirectAttributes) {
        try {
            kiralamaServis.kiralamaIptalEt(id);
            redirectAttributes.addFlashAttribute("basarili", "Rezervasyon iptal edildi.");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("hata", e.getMessage());
        }
        return "redirect:/kiralamalarim";
    }
}