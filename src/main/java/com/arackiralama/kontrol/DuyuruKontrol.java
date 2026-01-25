package com.arackiralama.kontrol;

import com.arackiralama.model.Duyuru;
import com.arackiralama.servis.DuyuruServis;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/duyurular")
@CrossOrigin(origins = "*")
public class DuyuruKontrol {

    private final DuyuruServis duyuruServis;

    public DuyuruKontrol(DuyuruServis duyuruServis) {
        this.duyuruServis = duyuruServis;
    }

    // Tüm duyuruları listele (public - herkes görebilir)
    @GetMapping
    public ResponseEntity<?> tumDuyurular() {
        try {
            List<Duyuru> duyurular = duyuruServis.tumDuyurulariGetir();
            return ResponseEntity.ok(duyurular);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("hata", e.getMessage()));
        }
    }
}
