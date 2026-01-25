package com.arackiralama.kontrol;

import com.arackiralama.model.Bakim;
import com.arackiralama.model.Kiralama;
import com.arackiralama.servis.BakimServis;
import com.arackiralama.servis.KiralamaServis;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/personel")
@CrossOrigin(origins = "*")
public class MobilPersonelKontrol {

    private final KiralamaServis kiralamaServis;
    private final BakimServis bakimServis;
    private final com.arackiralama.servis.AracServis aracServis;
    private final com.arackiralama.servis.DuyuruServis duyuruServis;

    public MobilPersonelKontrol(KiralamaServis kiralamaServis, BakimServis bakimServis,
            com.arackiralama.servis.AracServis aracServis, com.arackiralama.servis.DuyuruServis duyuruServis) {
        this.kiralamaServis = kiralamaServis;
        this.bakimServis = bakimServis;
        this.aracServis = aracServis;
        this.duyuruServis = duyuruServis;
    }

    // ===== AKTİF KİRALAMALAR =====
    @GetMapping("/aktif-kiralamalar")
    public ResponseEntity<?> aktifKiralamalar() {
        try {
            List<Kiralama> aktifler = kiralamaServis.aktifKiralamalariGetir();
            return ResponseEntity.ok(aktifler);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== ARAÇ TESLİM ET =====
    @PostMapping("/teslim/{kiralamaId}")
    public ResponseEntity<?> teslimEt(@PathVariable Long kiralamaId) {
        try {
            kiralamaServis.teslimEt(kiralamaId);
            return ResponseEntity.ok(Map.of("mesaj", "Araç teslim edildi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== ARAÇ İADE AL =====
    @PostMapping("/iade/{kiralamaId}")
    public ResponseEntity<?> iadeAl(@PathVariable Long kiralamaId, @RequestBody Map<String, Object> body) {
        try {
            boolean hasarli = body.get("hasarli") != null && (Boolean) body.get("hasarli");
            String hasarAciklamasi = (String) body.get("hasarAciklamasi");

            kiralamaServis.iadeAl(kiralamaId, hasarli, hasarAciklamasi);
            return ResponseEntity.ok(Map.of("mesaj", "Araç iade alındı"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== BAKIM LİSTESİ =====
    @GetMapping("/bakimlar")
    public ResponseEntity<?> bakimListesi() {
        try {
            List<Bakim> bakimlar = bakimServis.aktifBakimlariGetir();
            return ResponseEntity.ok(bakimlar);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== BAKIM TAMAMLA =====
    @PostMapping("/bakim/{bakimId}/tamamla")
    public ResponseEntity<?> bakimTamamla(@PathVariable Long bakimId, @RequestBody Map<String, Object> body) {
        try {
            BigDecimal masraf = new BigDecimal(body.get("masraf").toString());
            bakimServis.bakimTamamla(bakimId, masraf);
            return ResponseEntity.ok(Map.of("mesaj", "Bakım tamamlandı"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== REZERVASYONLAR =====
    @GetMapping("/rezervasyonlar")
    public ResponseEntity<?> rezervasyonlar() {
        try {
            List<Kiralama> rezervasyonlar = kiralamaServis.rezervasyonlariGetir();
            return ResponseEntity.ok(rezervasyonlar);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }

    // ===== DASHBOARD (PANEL) VERİLERİ =====
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboardVerileri() {
        try {
            long toplamArac = aracServis.toplamAracSayisi();
            long aktifKiralama = kiralamaServis.aktifKiralamaSayisi();
            long bakimdakiArac = bakimServis.bakimdaOlanAracSayisi();
            long onayBekleyen = aracServis.onayBekleyenleriGetir().size();
            var duyurular = duyuruServis.tumDuyurulariGetir();

            return ResponseEntity.ok(Map.of(
                    "toplamArac", toplamArac,
                    "aktifKiralama", aktifKiralama,
                    "bakimdakiArac", bakimdakiArac,
                    "onayBekleyen", onayBekleyen,
                    "duyurular", duyurular));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }
}
