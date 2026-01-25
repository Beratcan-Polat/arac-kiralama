package com.arackiralama.servis;

import com.arackiralama.model.Kiralama;
import com.arackiralama.veritabani.KiralamaRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ZamanlanmisGorevServisi {

    private final KiralamaRepository kiralamaRepository;
    private final MailServis mailServis;

    public ZamanlanmisGorevServisi(KiralamaRepository kiralamaRepository, MailServis mailServis) {
        this.kiralamaRepository = kiralamaRepository;
        this.mailServis = mailServis;
    }

    // Her gün sabah 09:00'da çalışır
    // Cron: Saniye Dakika Saat Gün Ay HaftanınGünü
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void gecikmeKontroluYap() {
        System.out.println("--- ZAMANLANMIŞ GÖREV BAŞLADI: GECİKME KONTROLÜ ---");

        LocalDate bugun = LocalDate.now();
        List<Kiralama> gecikenler = kiralamaRepository.findGecikmisKiralamalar(bugun);

        if (gecikenler.isEmpty()) {
            System.out.println("Geciken araç bulunamadı.");
            return;
        }

        System.out.println(gecikenler.size() + " adet geciken kiralama tespit edildi. Uyarı mailleri gönderiliyor...");

        for (Kiralama kiralama : gecikenler) {
            mailGonder(kiralama);
        }

        System.out.println("--- ZAMANLANMIŞ GÖREV TAMAMLANDI ---");
    }

    private void mailGonder(Kiralama kiralama) {
        try {
            String mailIcerigi = "Sayın " + kiralama.getKullanici().getAd() + ",\n\n" +
                    kiralama.getArac().getPlaka() + " plakalı (" +
                    kiralama.getArac().getMarka() + " " + kiralama.getArac().getModel() +
                    ") aracımızın iade tarihi " + kiralama.getIadeTarihi() + " itibariyle dolmuştur.\n\n" +
                    "Lütfen aracı en kısa sürede ofisimize teslim ediniz veya süreyi uzatmak için bizimle iletişime geçiniz.\n"
                    +
                    "Teslim edilmeyen her gün için gecikme bedeli uygulanacağını hatırlatmak isteriz.\n\n" +
                    "İyi günler dileriz.";

            mailServis.mailGonder(kiralama.getKullanici().getEmail(), "ACİL: Araç İade Tarihi Geçti", mailIcerigi);
            System.out.println("Mail gönderildi: " + kiralama.getKullanici().getEmail());

        } catch (Exception e) {
            System.err.println("Gecikme maili gönderilemedi (ID: " + kiralama.getId() + "): " + e.getMessage());
        }
    }
}
