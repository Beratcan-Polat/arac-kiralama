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
    public ResponseEntity<GirisYaniti> kayitOl(@RequestBody KayitIstegi istek) {
        return ResponseEntity.ok(authServis.kayitOl(istek));
    }

    @PostMapping("/giris")
    public ResponseEntity<GirisYaniti> girisYap(@RequestBody GirisIstegi istek) {
        return ResponseEntity.ok(authServis.girisYap(istek));
    }
}