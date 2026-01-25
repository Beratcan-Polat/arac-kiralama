package com.arackiralama.kontrol;

import com.arackiralama.servis.AracServis;
import com.arackiralama.servis.BakimServis;
import com.arackiralama.servis.DuyuruServis;
import com.arackiralama.servis.FiyatPolitikasiServis;
import com.arackiralama.servis.KiralamaServis;
import com.arackiralama.servis.KullaniciServis;
import java.math.BigDecimal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class PanelKontrol {

    private final DuyuruServis duyuruServis;
    private final AracServis aracServis;
    private final BakimServis bakimServis;
    private final KiralamaServis kiralamaServis;
    private final KullaniciServis kullaniciServis;
    private final FiyatPolitikasiServis fiyatPolitikasiServis;

    public PanelKontrol(DuyuruServis duyuruServis, AracServis aracServis,
            BakimServis bakimServis, KiralamaServis kiralamaServis,
            KullaniciServis kullaniciServis, FiyatPolitikasiServis fiyatPolitikasiServis) {
        this.duyuruServis = duyuruServis;
        this.aracServis = aracServis;
        this.bakimServis = bakimServis;
        this.kiralamaServis = kiralamaServis;
        this.kullaniciServis = kullaniciServis;
        this.fiyatPolitikasiServis = fiyatPolitikasiServis;
    }

    // ... (Existing endpoints) ...

    @GetMapping("/admin/fiyat-politikalari")
    public String fiyatPolitikalari(Model model) {
        model.addAttribute("politikalar", fiyatPolitikasiServis.tumPolitikalariGetir());
        return "admin/fiyat-politikalari";
    }

    @PostMapping("/admin/politika-guncelle")
    public String politikaGuncelle(@RequestParam Long id,
            @RequestParam java.math.BigDecimal minFiyat,
            @RequestParam java.math.BigDecimal maxFiyat,
            RedirectAttributes attributes) {
        fiyatPolitikasiServis.politikaGuncelle(id, minFiyat, maxFiyat);
        attributes.addFlashAttribute("mesaj", "Fiyat politikası güncellendi.");
        return "redirect:/admin/fiyat-politikalari";
    }

    @PostMapping("/admin/politika-ekle")
    public String politikaEkle(@RequestParam String aracSinifi,
            @RequestParam java.math.BigDecimal minFiyat,
            @RequestParam java.math.BigDecimal maxFiyat,
            RedirectAttributes attributes) {
        try {
            fiyatPolitikasiServis.politikaEkle(aracSinifi, minFiyat, maxFiyat);
            attributes.addFlashAttribute("mesaj", "Yeni politika eklendi.");
        } catch (Exception e) {
            attributes.addFlashAttribute("hata", "Hata: " + e.getMessage());
        }
        return "redirect:/admin/fiyat-politikalari";
    }

    @GetMapping("/admin/politika-sil/{id}")
    public String politikaSil(@org.springframework.web.bind.annotation.PathVariable Long id,
            RedirectAttributes attributes) {
        fiyatPolitikasiServis.politikaSil(id);
        attributes.addFlashAttribute("mesaj", "Politika silindi.");
        return "redirect:/admin/fiyat-politikalari";
    }

    @GetMapping("/admin/panel")
    public String adminPanel(Model model) {
        // İstatistikler
        model.addAttribute("toplamArac", aracServis.toplamAracSayisi());
        model.addAttribute("aktifKiralama", kiralamaServis.aktifKiralamaSayisi());
        model.addAttribute("bakimSayisi", bakimServis.bakimdaOlanAracSayisi());
        model.addAttribute("toplamGelir", kiralamaServis.toplamGelirHesapla());

        // Listeler
        model.addAttribute("duyuruListesi", duyuruServis.tumDuyurulariGetir());
        model.addAttribute("onayBekleyenAraclar", aracServis.onayBekleyenleriGetir());
        model.addAttribute("bakimdakiAraclar", bakimServis.aktifBakimlariGetir());
        return "admin/panel";
    }

    @GetMapping("/admin/ciro-raporu")
    public String ciroRaporu(Model model) {
        // Gelir hesaplaması
        var tamamlanmisKiralamalar = kiralamaServis.tamamlanmisKiralamalariGetir();
        BigDecimal toplamGelir = kiralamaServis.toplamGelirHesapla();

        // Gider hesaplaması
        var bakimKayitlari = bakimServis.tumBakimlariGetir();
        BigDecimal toplamGider = bakimServis.toplamBakimMasrafiHesapla();

        // Net kar
        BigDecimal netKar = toplamGelir.subtract(toplamGider);

        model.addAttribute("gelirListesi", tamamlanmisKiralamalar);
        model.addAttribute("giderListesi", bakimKayitlari);
        model.addAttribute("toplamGelir", toplamGelir);
        model.addAttribute("toplamGider", toplamGider);
        model.addAttribute("netKar", netKar);

        return "admin/ciro-raporu";
    }

    @GetMapping("/admin/kullanicilar")
    public String kullaniciListesi(Model model) {
        model.addAttribute("kullanicilar", kullaniciServis.tumKullanicilariGetir());
        return "admin/kullanicilar";
    }

    @GetMapping("/admin/arac-onayla/{id}")
    public String aracOnayla(@org.springframework.web.bind.annotation.PathVariable Long id,
            RedirectAttributes attributes) {
        aracServis.aracOnayla(id);
        attributes.addFlashAttribute("mesaj", "Araç onaylandı ve hizmete sunuldu.");
        return "redirect:/admin/panel";
    }

    @GetMapping("/admin/arac-reddet/{id}")
    public String aracReddet(@org.springframework.web.bind.annotation.PathVariable Long id,
            RedirectAttributes attributes) {
        try {
            aracServis.aracSil(id, true, "Admin tarafından onaylanmayıp reddedildi (Silindi).");
            attributes.addFlashAttribute("mesaj", "Araç reddedildi ve silindi.");
        } catch (RuntimeException e) {
            attributes.addFlashAttribute("hata", "Silme hatası: " + e.getMessage());
        }
        return "redirect:/admin/panel";
    }

    @GetMapping("/admin/duyuru-sil/{id}")
    public String duyuruSil(@org.springframework.web.bind.annotation.PathVariable Long id,
            RedirectAttributes attributes) {
        duyuruServis.duyuruSil(id);
        attributes.addFlashAttribute("mesaj", "Duyuru silindi.");
        return "redirect:/admin/panel";
    }

    @PostMapping("/admin/duyuru-ekle")
    public String duyuruEkle(@RequestParam String baslik,
            @RequestParam String icerik,
            RedirectAttributes attributes) {
        duyuruServis.duyuruEkle(baslik, icerik);
        attributes.addFlashAttribute("mesaj", "Duyuru başarıyla yayınlandı!");
        return "redirect:/admin/panel";
    }

    @GetMapping("/personel/panel")
    public String personelPanel(Model model) {
        // İstatistikler
        model.addAttribute("toplamArac", aracServis.toplamAracSayisi());
        model.addAttribute("aktifKiralama", kiralamaServis.aktifKiralamaSayisi());
        model.addAttribute("bakimSayisi", bakimServis.bakimdaOlanAracSayisi());

        // Listeler
        model.addAttribute("duyuruListesi", duyuruServis.tumDuyurulariGetir());
        model.addAttribute("onayBekleyenAraclar", aracServis.onayBekleyenleriGetir());
        return "personel/panel";
    }

    @PostMapping("/admin/bakim-tamamla")
    public String bakimTamamla(@RequestParam Long bakimId, @RequestParam java.math.BigDecimal masraf,
            RedirectAttributes attributes) {
        bakimServis.bakimiTamamla(bakimId, masraf);
        attributes.addFlashAttribute("mesaj", "Araç bakımı tamamlandı ve tekrar hizmete sunuldu.");
        return "redirect:/admin/panel";
    }

    @GetMapping("/personel/iade")
    public String iadeSayfasi(Model model) {
        var aktifKiralamalar = kiralamaServis.aktifKiralamalariGetir();

        // Her kiralama için gecikme hesaplama yap
        for (var kiralama : aktifKiralamalar) {
            kiralamaServis.gecikmeHesapla(kiralama.getId());
        }

        // Güncellenmiş verileri tekrar al
        aktifKiralamalar = kiralamaServis.aktifKiralamalariGetir();
        model.addAttribute("aktifKiralamalar", aktifKiralamalar);
        return "personel/iade";
    }

    @GetMapping("/personel/rezervasyonlar")
    public String rezervasyonSayfasi(Model model) {
        model.addAttribute("bekleyenRezervasyonlar", kiralamaServis.bekleyenRezervasyonlariGetir());
        return "personel/rezervasyonlar";
    }

    @PostMapping("/personel/teslim-et")
    public String teslimEtIslemi(@RequestParam Long kiralamaId, RedirectAttributes attributes) {
        kiralamaServis.araciTeslimEt(kiralamaId);
        attributes.addFlashAttribute("mesaj", "Araç başarıyla müşteriye teslim edildi ve kiralama başlatıldı.");
        return "redirect:/personel/rezervasyonlar";
    }

    @PostMapping("/admin/rol-guncelle")
    public String rolGuncelle(@RequestParam Long userId, @RequestParam com.arackiralama.model.Rol rol,
            RedirectAttributes attributes) {
        kullaniciServis.rolGuncelle(userId, rol);
        attributes.addFlashAttribute("mesaj", "Kullanıcı rolü güncellendi: " + rol);
        return "redirect:/admin/kullanicilar";
    }

    @PostMapping("/personel/iade-al")
    public String iadeIslemi(@RequestParam Long kiralamaId,
            @RequestParam(defaultValue = "false") boolean hasarli,
            @RequestParam(required = false) String hasarAciklamasi,
            RedirectAttributes attributes) {
        kiralamaServis.iadeAl(kiralamaId, hasarli, hasarAciklamasi);
        if (hasarli) {
            attributes.addFlashAttribute("mesaj", "Araç hasarlı olarak iade alındı ve bakıma sevk edildi.");
        } else {
            attributes.addFlashAttribute("mesaj", "Araç sorunsuz teslim alındı.");
        }
        return "redirect:/personel/iade";
    }
}