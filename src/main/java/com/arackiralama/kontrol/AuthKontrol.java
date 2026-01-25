package com.arackiralama.kontrol;

import com.arackiralama.dto.GirisIstegi;
import com.arackiralama.dto.GirisYaniti;
import com.arackiralama.dto.KayitIstegi;
import com.arackiralama.servis.AuthServis;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthKontrol {

    private final AuthServis authServis;

    public AuthKontrol(AuthServis authServis) {
        this.authServis = authServis;
    }

    @PostMapping("/kayit")
    public ResponseEntity<?> kayitOl(@RequestBody KayitIstegi istek) {
        try {
            return ResponseEntity.ok(authServis.kayitOl(istek));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/giris")
    public ResponseEntity<?> girisYap(@RequestBody GirisIstegi istek) {
        try {
            return ResponseEntity.ok(authServis.girisYap(istek));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}