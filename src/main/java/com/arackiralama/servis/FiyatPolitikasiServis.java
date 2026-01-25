package com.arackiralama.servis;

import com.arackiralama.model.FiyatPolitikasi;
import com.arackiralama.veritabani.FiyatPolitikasiRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class FiyatPolitikasiServis {

    private final FiyatPolitikasiRepository fiyatPolitikasiRepository;

    public FiyatPolitikasiServis(FiyatPolitikasiRepository fiyatPolitikasiRepository) {
        this.fiyatPolitikasiRepository = fiyatPolitikasiRepository;
    }

    public List<FiyatPolitikasi> tumPolitikalariGetir() {
        return fiyatPolitikasiRepository.findAll();
    }

    public void politikaGuncelle(Long id, BigDecimal minFiyat, BigDecimal maxFiyat) {
        FiyatPolitikasi politika = fiyatPolitikasiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Politika bulunamadı"));
        politika.setMinFiyat(minFiyat);
        politika.setMaxFiyat(maxFiyat);
        fiyatPolitikasiRepository.save(politika);
    }

    public void politikaEkle(String aracSinifi, BigDecimal minFiyat, BigDecimal maxFiyat) {
        if (fiyatPolitikasiRepository.findByAracSinifi(aracSinifi).isPresent()) {
            throw new RuntimeException("Bu araç sınıfı için zaten bir politika mevcut!");
        }
        FiyatPolitikasi yeniPolitika = new FiyatPolitikasi(aracSinifi, minFiyat, maxFiyat);
        fiyatPolitikasiRepository.save(yeniPolitika);
    }

    public void politikaSil(Long id) {
        fiyatPolitikasiRepository.deleteById(id);
    }
}
