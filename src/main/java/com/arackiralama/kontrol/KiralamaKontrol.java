package com.arackiralama.kontrol;

import com.arackiralama.dto.KiralamaIstegi;
import com.arackiralama.model.Kiralama;
import com.arackiralama.servis.KiralamaServis;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kiralamalar")
@CrossOrigin(origins = "*")
public class KiralamaKontrol {

    private final KiralamaServis kiralamaServis;

    public KiralamaKontrol(KiralamaServis kiralamaServis) {
        this.kiralamaServis = kiralamaServis;
    }

    @PostMapping
    public ResponseEntity<?> kiralamaOlustur(@RequestBody KiralamaIstegi istek) {
        try {
            Kiralama yeniKiralama = kiralamaServis.kiralamaYap(istek);
            return ResponseEntity.ok(yeniKiralama);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET http://localhost:8080/api/kiralamalar/gecmis?kullaniciId=1
    @GetMapping("/gecmis")
    public ResponseEntity<?> gecmisKiralamalarim(@RequestParam Long kullaniciId) {
        return ResponseEntity.ok(kiralamaServis.getirKullaniciKiralamalari(kullaniciId));
    }

    // POST http://localhost:8080/api/kiralamalar/iptal/1
    @PostMapping("/iptal/{id}")
    public ResponseEntity<?> kiralamaIptal(@PathVariable Long id) {
        try {
            kiralamaServis.kiralamaIptalEt(id);
            return ResponseEntity.ok("Kiralama iptal edildi.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}