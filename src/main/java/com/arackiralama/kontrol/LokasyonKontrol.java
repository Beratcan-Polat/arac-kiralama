package com.arackiralama.kontrol;

import com.arackiralama.model.Lokasyon;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/lokasyonlar")
@CrossOrigin(origins = "*")
public class LokasyonKontrol {

    @GetMapping
    public List<Lokasyon> tumLokasyonlariGetir() {
        List<Lokasyon> lokasyonlar = new ArrayList<>();

        // İstanbul (5)
        lokasyonlar.add(new Lokasyon("İstanbul", "İstanbul Havalimanı"));
        lokasyonlar.add(new Lokasyon("İstanbul", "İstanbul Sabiha Gökçen Havalimanı"));
        lokasyonlar.add(new Lokasyon("İstanbul", "İstanbul Ataşehir Watergarden AVM"));
        lokasyonlar.add(new Lokasyon("İstanbul", "İstanbul Maltepe Park AVM"));
        lokasyonlar.add(new Lokasyon("İstanbul", "İstanbul Kadıköy"));

        // Ankara (4)
        lokasyonlar.add(new Lokasyon("Ankara", "Ankara Esenboğa Havalimanı"));
        lokasyonlar.add(new Lokasyon("Ankara", "Ankara YHT Gar"));
        lokasyonlar.add(new Lokasyon("Ankara", "Ankara Atlantis AVM"));
        lokasyonlar.add(new Lokasyon("Ankara", "Ankara Kızılay"));

        // İzmir (3)
        lokasyonlar.add(new Lokasyon("İzmir", "İzmir Adnan Menderes Havalimanı"));
        lokasyonlar.add(new Lokasyon("İzmir", "İzmir Mavibahçe AVM"));
        lokasyonlar.add(new Lokasyon("İzmir", "İzmir Otogar"));

        // Adana (3)
        lokasyonlar.add(new Lokasyon("Adana", "Adana Şakirpaşa Havalimanı"));
        lokasyonlar.add(new Lokasyon("Adana", "Adana Optimum AVM"));
        lokasyonlar.add(new Lokasyon("Adana", "Adana Otogar"));

        // Antalya (3)
        lokasyonlar.add(new Lokasyon("Antalya", "Antalya Havalimanı"));
        lokasyonlar.add(new Lokasyon("Antalya", "Antalya Terra City AVM"));
        lokasyonlar.add(new Lokasyon("Antalya", "Antalya Otogar"));

        // Bursa (1)
        lokasyonlar.add(new Lokasyon("Bursa", "Bursa Yenişehir Havalimanı"));

        // Adıyaman (2)
        lokasyonlar.add(new Lokasyon("Adıyaman", "Adıyaman Havalimanı"));
        lokasyonlar.add(new Lokasyon("Adıyaman", "Adıyaman Merkez"));

        // Afyonkarahisar (2)
        lokasyonlar.add(new Lokasyon("Afyonkarahisar", "Afyonkarahisar Zafer Havalimanı"));
        lokasyonlar.add(new Lokasyon("Afyonkarahisar", "Afyonkarahisar Otogar"));

        // Ağrı (2)
        lokasyonlar.add(new Lokasyon("Ağrı", "Ağrı Havalimanı"));
        lokasyonlar.add(new Lokasyon("Ağrı", "Ağrı Merkez"));

        // Aksaray (1)
        lokasyonlar.add(new Lokasyon("Aksaray", "Aksaray Otogar"));

        // Amasya (2)
        lokasyonlar.add(new Lokasyon("Amasya", "Amasya Merzifon Havalimanı"));
        lokasyonlar.add(new Lokasyon("Amasya", "Amasya Merkez"));

        // Ardahan (1)
        lokasyonlar.add(new Lokasyon("Ardahan", "Ardahan Merkez"));

        // Artvin (1)
        lokasyonlar.add(new Lokasyon("Artvin", "Artvin Merkez"));

        // Aydın (2)
        lokasyonlar.add(new Lokasyon("Aydın", "Aydın Çıldır Havalimanı"));
        lokasyonlar.add(new Lokasyon("Aydın", "Aydın Otogar"));

        // Balıkesir (2)
        lokasyonlar.add(new Lokasyon("Balıkesir", "Balıkesir Koca Seyit Havalimanı"));
        lokasyonlar.add(new Lokasyon("Balıkesir", "Balıkesir Otogar"));

        // Bartın (1)
        lokasyonlar.add(new Lokasyon("Bartın", "Bartın Merkez"));

        // Batman (2)
        lokasyonlar.add(new Lokasyon("Batman", "Batman Havalimanı"));
        lokasyonlar.add(new Lokasyon("Batman", "Batman Park AVM"));

        // Bayburt (1)
        lokasyonlar.add(new Lokasyon("Bayburt", "Bayburt Merkez"));

        // Bilecik (1)
        lokasyonlar.add(new Lokasyon("Bilecik", "Bilecik Otogar"));

        // Bingöl (2)
        lokasyonlar.add(new Lokasyon("Bingöl", "Bingöl Havalimanı"));
        lokasyonlar.add(new Lokasyon("Bingöl", "Bingöl Merkez"));

        return lokasyonlar;
    }
}
