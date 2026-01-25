package com.arackiralama.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "araclar")
public class Arac {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String marka;
    private String model;

    @Column(length = 20)
    private String plaka; // YENİ: Plaka alanı eklendi

    // Konum bilgileri
    private String il; // Aracın bulunduğu il
    @Column(length = 1000)
    private String alisNoktasi; // Alış noktası (Havaliманı, AVM, Gar vb.)

    private BigDecimal gunlukFiyat;

    private String yakitTipi; // Benzin, Dizel, Elektrik
    private String vitesTipi; // Manuel, Otomatik

    private String aracSinifi; // Örn: Ekonomi, Konfor, Lüks
    private String kasaTipi; // Örn: Sedan, SUV, Hatchback

    private Integer minYas; // Örn: 21
    private Integer minGencYas; // Örn: 19 (Ek ücretle)
    private Integer minEhliyetYili; // Örn: 2
    private Integer minGencEhliyetYili;// Örn: 1
    private Integer gunlukKmLimiti; // Örn: 400
    private Integer teminatTutari;

    @Column(length = 1000)
    private String resimUrl;

    // İşte burada yukarıdaki Enum dosyasını kullanıyoruz:
    @Enumerated(EnumType.STRING)
    private AracDurum durum;

    // Getter ve Setter Metotları (Lombok kullanmıyorsanız aşağıdakileri ekleyin)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMarka() {
        return marka;
    }

    public void setMarka(String marka) {
        this.marka = marka;
    }

    public String getPlaka() {
        return plaka;
    }

    public void setPlaka(String plaka) {
        this.plaka = plaka;
    }

    public String getIl() {
        return il;
    }

    public void setIl(String il) {
        this.il = il;
    }

    public String getAlisNoktasi() {
        return alisNoktasi;
    }

    public void setAlisNoktasi(String alisNoktasi) {
        this.alisNoktasi = alisNoktasi;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public BigDecimal getGunlukFiyat() {
        return gunlukFiyat;
    }

    public void setGunlukFiyat(BigDecimal gunlukFiyat) {
        this.gunlukFiyat = gunlukFiyat;
    }

    public String getYakitTipi() {
        return yakitTipi;
    }

    public void setYakitTipi(String yakitTipi) {
        this.yakitTipi = yakitTipi;
    }

    public String getVitesTipi() {
        return vitesTipi;
    }

    public void setVitesTipi(String vitesTipi) {
        this.vitesTipi = vitesTipi;
    }

    public String getResimUrl() {
        return resimUrl;
    }

    public void setResimUrl(String resimUrl) {
        this.resimUrl = resimUrl;
    }

    public AracDurum getDurum() {
        return durum;
    }

    public void setDurum(AracDurum durum) {
        this.durum = durum;
    }

    public String getAracSinifi() {
        return aracSinifi;
    }

    public void setAracSinifi(String aracSinifi) {
        this.aracSinifi = aracSinifi;
    }

    public String getKasaTipi() {
        return kasaTipi;
    }

    public void setKasaTipi(String kasaTipi) {
        this.kasaTipi = kasaTipi;
    }

    public Integer getMinYas() {
        return minYas;
    }

    public void setMinYas(Integer minYas) {
        this.minYas = minYas;
    }

    public Integer getMinGencYas() {
        return minGencYas;
    }

    public void setMinGencYas(Integer minGencYas) {
        this.minGencYas = minGencYas;
    }

    public Integer getMinEhliyetYili() {
        return minEhliyetYili;
    }

    public void setMinEhliyetYili(Integer minEhliyetYili) {
        this.minEhliyetYili = minEhliyetYili;
    }

    public Integer getMinGencEhliyetYili() {
        return minGencEhliyetYili;
    }

    public void setMinGencEhliyetYili(Integer minGencEhliyetYili) {
        this.minGencEhliyetYili = minGencEhliyetYili;
    }

    public Integer getGunlukKmLimiti() {
        return gunlukKmLimiti;
    }

    public void setGunlukKmLimiti(Integer gunlukKmLimiti) {
        this.gunlukKmLimiti = gunlukKmLimiti;
    }

    public Integer getTeminatTutari() {
        return teminatTutari;
    }

    public void setTeminatTutari(Integer teminatTutari) {
        this.teminatTutari = teminatTutari;
    }

    @Column(name = "silindi", nullable = false)
    private boolean silindi = false;

    public boolean isSilindi() {
        return silindi;
    }

    public void setSilindi(boolean silindi) {
        this.silindi = silindi;
    }

    private String silinmeSebebi;
    private java.time.LocalDateTime silinmeTarihi;

    public String getSilinmeSebebi() {
        return silinmeSebebi;
    }

    public void setSilinmeSebebi(String silinmeSebebi) {
        this.silinmeSebebi = silinmeSebebi;
    }

    public java.time.LocalDateTime getSilinmeTarihi() {
        return silinmeTarihi;
    }

    public void setSilinmeTarihi(java.time.LocalDateTime silinmeTarihi) {
        this.silinmeTarihi = silinmeTarihi;
    }
}