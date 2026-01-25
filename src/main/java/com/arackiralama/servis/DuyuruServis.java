package com.arackiralama.servis;

import com.arackiralama.model.Duyuru;
import com.arackiralama.veritabani.DuyuruRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DuyuruServis {

    private final DuyuruRepository duyuruRepository;

    public DuyuruServis(DuyuruRepository duyuruRepository) {
        this.duyuruRepository = duyuruRepository;
    }

    public List<Duyuru> tumDuyurulariGetir() {
        return duyuruRepository.findAllByOrderByTarihDesc();
    }

    public void duyuruEkle(String baslik, String icerik) {
        Duyuru duyuru = new Duyuru();
        duyuru.setBaslik(baslik);
        duyuru.setIcerik(icerik);
        duyuru.setTarih(LocalDateTime.now());
        duyuruRepository.save(duyuru);
    }

    public void duyuruSil(Long id) {
        duyuruRepository.deleteById(id);
    }
}
