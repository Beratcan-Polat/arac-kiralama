package com.arackiralama.servis;

import com.arackiralama.model.Kullanici;
import com.arackiralama.veritabani.KullaniciRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KullaniciServis {

    @Autowired
    private KullaniciRepository kullaniciRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void kaydet(Kullanici kullanici) {
        kullanici.setSifre(passwordEncoder.encode(kullanici.getSifre()));
        kullanici.setRol(com.arackiralama.model.Rol.MUSTERI);
        kullaniciRepository.save(kullanici);
    }

    public List<Kullanici> tumKullanicilariGetir() {
        return kullaniciRepository.findAll();
    }

    public void rolGuncelle(Long id, com.arackiralama.model.Rol yeniRol) {
        Kullanici kullanici = kullaniciRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        kullanici.setRol(yeniRol);
        kullaniciRepository.save(kullanici);
    }
}
