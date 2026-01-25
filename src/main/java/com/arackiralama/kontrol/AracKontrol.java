package com.arackiralama.kontrol;

import com.arackiralama.model.Arac;
import com.arackiralama.servis.AracServis;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/araclar")
@CrossOrigin(origins = "*") // React ve Mobil uygulamanın erişimine izin verir
public class AracKontrol {

    private final AracServis aracServis;

    public AracKontrol(AracServis aracServis) {
        this.aracServis = aracServis;
    }

    // GET http://localhost:8080/api/araclar
    @GetMapping
    public List<Arac> tumunuListele() {
        return aracServis.tumAraclariGetir();
    }

    // GET http://localhost:8080/api/araclar/musait
    @GetMapping("/musait")
    public List<Arac> musaitOlanlariListele() {
        return aracServis.musaitAraclariGetir();
    }

    // POST http://localhost:8080/api/araclar
    @PostMapping
    public ResponseEntity<Arac> aracEkle(@RequestBody Arac arac) {
        Arac kaydedilenArac = aracServis.aracKaydet(arac);
        return ResponseEntity.ok(kaydedilenArac);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Arac> aracGuncelle(@PathVariable Long id, @RequestBody Arac arac) {
        Arac guncellenenArac = aracServis.aracGuncelle(id, arac);
        return ResponseEntity.ok(guncellenenArac);
    }

    // DELETE http://localhost:8080/api/araclar/1?zorla=true
    @DeleteMapping("/{id}")
    public ResponseEntity<?> aracSil(@PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean zorla,
            @RequestParam(required = false) String silinmeSebebi) {
        try {
            String sonucMesaji = aracServis.aracSil(id, zorla, silinmeSebebi);
            return ResponseEntity.ok(sonucMesaji);

        } catch (RuntimeException e) {
            String mesaj = e.getMessage();

            // Eğer uyarı mesajı ise Frontend'e farklı bir statü dön (Örn: 409 Conflict)
            // Frontend bu kodu görünce "Emin misin?" kutusu açacak.
            if (mesaj.startsWith("UYARI")) {
                return ResponseEntity.status(409).body(mesaj);
            }

            // Diğer hatalar (örn: Araç Kirada) için 400 Bad Request
            return ResponseEntity.badRequest().body(mesaj);
        }
    }

    // GET
    // http://localhost:8080/api/araclar/ara?alisYeri=X&alisTarihi=Y&iadeTarihi=Z
    @GetMapping("/ara")
    public List<Arac> aracAra(
            @RequestParam(required = false) String alisYeri,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate alisTarihi,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate iadeTarihi) {
        return aracServis.araclariFiltrele(alisYeri, alisTarihi, iadeTarihi);
    }
}