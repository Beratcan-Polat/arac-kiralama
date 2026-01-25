package com.arackiralama.veritabani;

import com.arackiralama.model.Kiralama;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface KiralamaRepository extends JpaRepository<Kiralama, Long> {

        // Bir müşterinin kendi geçmiş kiralamalarını görmesi için
        List<Kiralama> findByKullaniciId(Long kullaniciId);

        // Belirli durumdaki kiralamaları bul
        List<Kiralama> findByDurum(String durum);

        // Tarih çakışması kontrolü: Belirli bir araç için verilen tarihler arasında
        // overlap var mı?
        @Query("SELECT k FROM Kiralama k WHERE k.arac.id = :aracId " +
                        "AND k.durum IN ('AKTIF', 'ONAY_BEKLIYOR', 'KIRADA', 'REZERVE', 'TESLIM_EDILDI') " +
                        "AND ((k.alisTarihi BETWEEN :baslangic AND :bitis) " +
                        "OR (k.iadeTarihi BETWEEN :baslangic AND :bitis) " +
                        "OR (:baslangic BETWEEN k.alisTarihi AND k.iadeTarihi))")
        List<Kiralama> findOverlappingBookings(@Param("aracId") Long aracId,
                        @Param("baslangic") LocalDate baslangic,
                        @Param("bitis") LocalDate bitis);

        // ÇAKIŞMA KONTROLÜ
        // Seçilen tarih aralığında, bu araç için 'IPTAL' olmayan başka bir kayıt var
        // mı?
        @Query("SELECT k FROM Kiralama k WHERE k.arac.id = :aracId " +
                        "AND k.durum IN ('REZERVE', 'KIRADA', 'TESLIM_EDILDI', 'ONAY_BEKLIYOR') " +
                        "AND (" +
                        "(k.alisTarihi BETWEEN :baslangic AND :bitis) OR " +
                        "(k.iadeTarihi BETWEEN :baslangic AND :bitis) OR " +
                        "(:baslangic BETWEEN k.alisTarihi AND k.iadeTarihi)" +
                        ")")
        List<Kiralama> tarihCakisiyorMu(@Param("aracId") Long aracId,
                        @Param("baslangic") LocalDate baslangic,
                        @Param("bitis") LocalDate bitis);

        // 1. Araç şu an aktif olarak KİRADA mı? (İade tarihi gelmemiş veya durumu
        // KIRADA olanlar)
        @Query("SELECT COUNT(k) > 0 FROM Kiralama k WHERE k.arac.id = :aracId AND (k.durum = 'KIRADA' OR k.durum = 'TESLIM_EDILDI')")
        boolean aracKiradaMi(@Param("aracId") Long aracId);

        // 2. Aracın geleceğe dönük REZERVASYONU var mı?
        @Query("SELECT COUNT(k) > 0 FROM Kiralama k WHERE k.arac.id = :aracId AND k.durum = 'REZERVE'")
        boolean gelecekRezervasyonuVarMi(@Param("aracId") Long aracId);

        // 3. Aracın gelecekteki rezervasyonlarını listele (İptal etmek gerekirse diye)
        @Query("SELECT k FROM Kiralama k WHERE k.arac.id = :aracId AND k.durum = 'REZERVE'")
        List<Kiralama> gelecekRezervasyonlariGetir(@Param("aracId") Long aracId);

        // 4. Aracın geçmişte HİÇ kaydı var mı? (Hard Delete vs Soft Delete kararı için)
        boolean existsByAracId(Long aracId);

        // GECİKEN KİRALAMALARI BUL
        // Durumu 'TESLIM_EDILDI' olan (yani iade edilmemiş) ve iade tarihi bugünden
        // ÖNCE
        // olanlar
        @Query("SELECT k FROM Kiralama k WHERE k.durum = 'TESLIM_EDILDI' AND k.iadeTarihi < :bugun")
        List<Kiralama> findGecikmisKiralamalar(@Param("bugun") LocalDate bugun);
}