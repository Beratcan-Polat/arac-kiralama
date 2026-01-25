package com.arackiralama.guvenlik;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtServis {

    // application.properties dosyasından bu değeri okuyacak
    // Örnek:
    // jwt.gizli-anahtar=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
    @Value("${jwt.secret}")
    private String gizliAnahtar;

    // Kullanıcı adını token'dan çıkarma
    public String kullaniciAdiGetir(String token) {
        return claimGetir(token, Claims::getSubject);
    }

    // Her türlü veriyi (Claim) çıkarma
    public <T> T claimGetir(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = tumClaimleriGetir(token);
        return claimsResolver.apply(claims);
    }

    // Token oluşturma (Sadece kullanıcı adı ile)
    public String tokenOlustur(UserDetails userDetails) {
        return tokenOlustur(new HashMap<>(), userDetails);
    }

    // Token oluşturma (Ekstra verilerle)
    public String tokenOlustur(Map<String, Object> ekstraClaimler, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(ekstraClaimler)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 Saat geçerli
                .signWith(imzaAnahtariGetir(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Token doğrulama
    public boolean tokenDogrula(String token, UserDetails userDetails) {
        final String kullaniciAdi = kullaniciAdiGetir(token);
        return (kullaniciAdi.equals(userDetails.getUsername()) && !tokenSuresiDolmusMu(token));
    }

    private boolean tokenSuresiDolmusMu(String token) {
        return sonKullanmaTarihiGetir(token).before(new Date());
    }

    private Date sonKullanmaTarihiGetir(String token) {
        return claimGetir(token, Claims::getExpiration);
    }

    private Claims tumClaimleriGetir(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(imzaAnahtariGetir())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key imzaAnahtariGetir() {
        byte[] keyBytes = Decoders.BASE64.decode(gizliAnahtar);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}