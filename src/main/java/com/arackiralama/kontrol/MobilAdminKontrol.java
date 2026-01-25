package com.arackiralama.kontrol;

import com.arackiralama.model.Duyuru;
import com.arackiralama.model.FiyatPolitikasi;
import com.arackiralama.model.Kullanici;
import com.arackiralama.model.Rol;
import com.arackiralama.servis.BakimServis;
import com.arackiralama.servis.DuyuruServis;
import com.arackiralama.servis.FiyatPolitikasiServis;
import com.arackiralama.servis.KiralamaServis;
import com.arackiralama.servis.KullaniciServis;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class MobilAdminKontrol {

    private final KiralamaServis kiralamaServis;
    private final KullaniciServis kullaniciServis;
    private final DuyuruServis duyuruServis;
    private final FiyatPolitikasiServis fiyatPolitikasiServis;
    private final BakimServis bakimServis;
    private final com.arackiralama.servis.AracServis aracServis;

    public MobilAdminKontrol(KiralamaServis kiralamaServis, KullaniciServis kullaniciServis,
            DuyuruServis duyuruServis, FiyatPolitikasiServis fiyatPolitikasiServis,
            BakimServis bakimServis, com.arackiralama.servis.AracServis aracServis) {
        this.kiralamaServis = kiralamaServis;
        this.kullaniciServis = kullaniciServis;
        this.duyuruServis = duyuruServis;
        this.fiyatPolitikasiServis = fiyatPolitikasiServis;
        this.bakimServis = bakimServis;
        this.aracServis = aracServis;
    }

    // ===== CİRO RAPORU =====
    @GetMapping("/ciro")
    public ResponseEntity<?> ciroRaporu() {
        try {
            // Gelir hesaplaması
            var tamamlanmisKiralamalar = kiralamaServis.tamamlanmisKiralamalariGetir();
            BigDecimal toplamGelir = kiralamaServis.toplamGelirHesapla();

            // Gider hesaplaması
            var bakimKayitlari = bakimServis.tumBakimlariGetir();
            BigDecimal toplamGider = bakimServis.toplamBakimMasrafiHesapla();

            long toplamKiralama = kiralamaServis.toplamKiralamaSayisi();
            BigDecimal aylikCiro = kiralamaServis.aylikCiroHesapla();

            return ResponseEntity.ok(Map.of(
                    "toplamCiro", toplamGelir != null ? toplamGelir : BigDecimal.ZERO,
                    "aylikCiro", aylikCiro != null ? aylikCiro : BigDecimal.ZERO,
                    "toplamKiralama", toplamKiralama,
                    "tamamlanmisKiralamalar", tamamlanmisKiralamalar,
                    "bakimlar", bakimKayitlari,
                    "toplamGider", toplamGider != null ? toplamGider : BigDecimal.ZERO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== KULLANICI YÖNETİMİ =====
    @GetMapping("/kullanicilar")
    public ResponseEntity<?> kullaniciListesi() {
        try {
            List<Kullanici> kullanicilar = kullaniciServis.tumKullanicilariGetir();
            return ResponseEntity.ok(kullanicilar);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    @PutMapping("/kullanici/{id}/rol")
    public ResponseEntity<?> rolGuncelle(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String rolStr = body.get("rol");
            Rol yeniRol = Rol.valueOf(rolStr);
            kullaniciServis.rolGuncelle(id, yeniRol);
            return ResponseEntity.ok(Map.of("mesaj", "Rol güncellendi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== DUYURU YÖNETİMİ =====
    @GetMapping("/duyurular")
    public ResponseEntity<?> duyurulariListele() {
        try {
            List<Duyuru> duyurular = duyuruServis.tumDuyurulariGetir();
            return ResponseEntity.ok(duyurular);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    @PostMapping("/duyuru")
    public ResponseEntity<?> duyuruEkle(@RequestBody Map<String, String> body) {
        try {
            String baslik = body.get("baslik");
            String icerik = body.get("icerik");
            duyuruServis.duyuruEkle(baslik, icerik);
            return ResponseEntity.ok(Map.of("mesaj", "Duyuru eklendi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    @DeleteMapping("/duyuru/{id}")
    public ResponseEntity<?> duyuruSil(@PathVariable Long id) {
        try {
            duyuruServis.duyuruSil(id);
            return ResponseEntity.ok(Map.of("mesaj", "Duyuru silindi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== FİYAT POLİTİKASI =====
    @GetMapping("/fiyat-politikalari")
    public ResponseEntity<?> fiyatPolitikalari() {
        try {
            List<FiyatPolitikasi> politikalar = fiyatPolitikasiServis.tumPolitikalariGetir();
            return ResponseEntity.ok(politikalar);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    @PostMapping("/fiyat-politikasi")
    public ResponseEntity<?> fiyatPolitikasiEkle(@RequestBody Map<String, Object> body) {
        try {
            String aracSinifi = (String) body.get("aracSinifi");
            BigDecimal minFiyat = new BigDecimal(body.get("minFiyat").toString());
            BigDecimal maxFiyat = new BigDecimal(body.get("maxFiyat").toString());
            fiyatPolitikasiServis.politikaEkle(aracSinifi, minFiyat, maxFiyat);
            return ResponseEntity.ok(Map.of("mesaj", "Fiyat politikası eklendi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    @PutMapping("/fiyat-politikasi/{id}")
    public ResponseEntity<?> fiyatPolitikasiGuncelle(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            BigDecimal minFiyat = new BigDecimal(body.get("minFiyat").toString());
            BigDecimal maxFiyat = new BigDecimal(body.get("maxFiyat").toString());
            fiyatPolitikasiServis.politikaGuncelle(id, minFiyat, maxFiyat);
            return ResponseEntity.ok(Map.of("mesaj", "Fiyat politikası güncellendi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    @DeleteMapping("/fiyat-politikasi/{id}")
    public ResponseEntity<?> fiyatPolitikasiSil(@PathVariable Long id) {
        try {
            fiyatPolitikasiServis.politikaSil(id);
            return ResponseEntity.ok(Map.of("mesaj", "Fiyat politikası silindi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }

    }

    // ===== ARAÇ ONAY YÖNETİMİ =====
    @GetMapping("/onay-bekleyenler")
    public ResponseEntity<?> onayBekleyenler() {
        try {
            return ResponseEntity.ok(aracServis.onayBekleyenleriGetir());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    @PostMapping("/arac-onayla/{id}")
    public ResponseEntity<?> aracOnayla(@PathVariable Long id) {
        try {
            aracServis.aracOnayla(id);
            return ResponseEntity.ok(Map.of("mesaj", "Araç onaylandı"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    @PostMapping("/arac-reddet/{id}")
    public ResponseEntity<?> aracReddet(@PathVariable Long id) {
        try {
            // Reddedilen araç 'silindi' olarak işaretlenir
            aracServis.aracSil(id, true, "Admin tarafından reddedildi");
            return ResponseEntity.ok(Map.of("mesaj", "Araç reddedildi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }
}
