package com.arackiralama.guvenlik;

import com.arackiralama.model.Kullanici;
import com.arackiralama.veritabani.KullaniciRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class KullaniciDetayServisi implements UserDetailsService {

    private final KullaniciRepository kullaniciRepository;

    public KullaniciDetayServisi(KullaniciRepository kullaniciRepository) {
        this.kullaniciRepository = kullaniciRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Kullanici kullanici = kullaniciRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + email));

        // Spring Security'nin anlayacağı User nesnesine çeviriyoruz
        return new User(
                kullanici.getEmail(),
                kullanici.getSifre(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + kullanici.getRol().name()))
        );
    }
}