package com.arackiralama.servis;

import com.arackiralama.dto.GirisIstegi;
import com.arackiralama.dto.GirisYaniti;
import com.arackiralama.dto.KayitIstegi;
import com.arackiralama.guvenlik.JwtServis;
import com.arackiralama.guvenlik.KullaniciDetayServisi;
import com.arackiralama.model.Kullanici;
import com.arackiralama.model.Rol;
import com.arackiralama.veritabani.KullaniciRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthServis {

    private final KullaniciRepository kullaniciRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtServis jwtServis;
    private final KullaniciDetayServisi kullaniciDetayServisi;
    private final MailServis mailServis;

    public AuthServis(KullaniciRepository kullaniciRepository, PasswordEncoder passwordEncoder, JwtServis jwtServis,
            KullaniciDetayServisi kullaniciDetayServisi, MailServis mailServis) {
        this.kullaniciRepository = kullaniciRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtServis = jwtServis;
        this.kullaniciDetayServisi = kullaniciDetayServisi;
        this.mailServis = mailServis;
    }

    public GirisYaniti kayitOl(KayitIstegi istek) {
        // Kullanıcı var mı kontrolü
        if (kullaniciRepository.findByEmail(istek.getEmail()).isPresent()) {
            throw new RuntimeException("Bu email adresi zaten kullanılıyor!");
        }

        Kullanici yeniKullanici = new Kullanici();
        yeniKullanici.setAd(istek.getAd());
        yeniKullanici.setEmail(istek.getEmail());
        // Şifreyi güvenli hale getiriyoruz (Hashliyoruz)
        yeniKullanici.setSifre(passwordEncoder.encode(istek.getSifre()));
        yeniKullanici.setRol(Rol.MUSTERI); // Varsayılan olarak Müşteri yapıyoruz

        kullaniciRepository.save(yeniKullanici);

        // HOŞ GELDİN MAİLİ
        try {
            String mailIcerigi = "Sayın " + yeniKullanici.getAd() + ",\n\n" +
                    "RotaCar araç kiralama platformuna hoş geldiniz!\n" +
                    "Üyeliğiniz başarıyla oluşturulmuştur. Artık web sitemiz veya mobil uygulamamız üzerinden " +
                    "dilediğiniz aracı kolayca kiralayabilirsiniz.\n\n" +
                    "Her zaman yanınızdayız,\n" +
                    "RotaCar Ekibi";

            mailServis.mailGonder(yeniKullanici.getEmail(), "Aramıza Hoş Geldiniz! 🚗", mailIcerigi);
        } catch (Exception e) {
            System.err.println("Hoş geldin maili gönderilemedi: " + e.getMessage());
        }

        // Token oluşturmak için UserDetails gerekiyor
        UserDetails userDetails = kullaniciDetayServisi.loadUserByUsername(yeniKullanici.getEmail());
        String token = jwtServis.tokenOlustur(userDetails);

        return new GirisYaniti(token, "Kayıt Başarılı", yeniKullanici.getId(), yeniKullanici.getAd(),
                yeniKullanici.getRol());
    }

    public GirisYaniti girisYap(GirisIstegi istek) {
        Optional<Kullanici> kullaniciOp = kullaniciRepository.findByEmail(istek.getEmail());

        if (kullaniciOp.isPresent()) {
            Kullanici kullanici = kullaniciOp.get();
            // Şifre kontrolü: (Girilen Şifre, Veritabanındaki Kriptolu Şifre)
            if (passwordEncoder.matches(istek.getSifre(), kullanici.getSifre())) {
                UserDetails userDetails = kullaniciDetayServisi.loadUserByUsername(kullanici.getEmail());
                String token = jwtServis.tokenOlustur(userDetails);
                return new GirisYaniti(token, "Giriş Başarılı", kullanici.getId(), kullanici.getAd(),
                        kullanici.getRol());
            }
        }
        throw new RuntimeException("Email veya şifre hatalı!");
    }
}