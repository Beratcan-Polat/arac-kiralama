package com.arackiralama.servis;

import com.arackiralama.model.Arac;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AIServis {

    // 1. Araç Önerisi (Mock Logic - Şimdilik kurallı bir yapı)
    public List<String> onerArac(String kriter) {
        List<String> oneriler = new ArrayList<>();
        kriter = kriter.toLowerCase();

        if (kriter.contains("aile") || kriter.contains("geniş")) {
            oneriler.add("SUV tipli araçlar tam size göre (Örn: Peugeot 3008)");
            oneriler.add("Geniş bagajlı Station Wagon modelleri inceleyin.");
        } else if (kriter.contains("ekonomik") || kriter.contains("ucuz")) {
            oneriler.add("Yakıt tasarrufu için Dizel veya Hibrit araçları seçin (Örn: Renault Clio).");
        } else if (kriter.contains("hız") || kriter.contains("lüks")) {
            oneriler.add("Premium segment araçlarımıza göz atın (Örn: BMW 520i).");
        } else {
            oneriler.add("Sizin için en popüler araçlarımız: Renault Megane, Ford Focus.");
        }

        return oneriler;
    }

    // 2. Açıklama Üretme (Aracın özelliklerine göre otomatik metin)
    public String olusturAciklama(Arac arac) {
        if (arac == null)
            return "Araç bilgisi bulunamadı.";

        StringBuilder sb = new StringBuilder();
        sb.append(arac.getMarka()).append(" ").append(arac.getModel());
        sb.append(", ").append(arac.getYakitTipi()).append(" yakıt tipi ve ");
        sb.append(arac.getVitesTipi()).append(" vites seçeneğiyle konforlu bir sürüş sunar. ");

        if (arac.getGunlukFiyat() != null) {
            sb.append("Günlük sadece ").append(arac.getGunlukFiyat()).append(" TL ile kiralayabilirsiniz. ");
        }

        if (arac.getKasaTipi() != null && arac.getKasaTipi().equalsIgnoreCase("SUV")) {
            sb.append("Geniş iç hacmiyle uzun yolculuklar ve aileler için idealdir.");
        } else {
            sb.append("Şehir içi kullanım için pratik ve ekonomiktir.");
        }

        return sb.toString();
    }
}
