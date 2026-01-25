package com.arackiralama.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "kiralamalar")
public class Kiralama {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Hangi Araç? (Arac tablosuyla ilişki)
    @ManyToOne
    @JoinColumn(name = "arac_id", nullable = false)
    private Arac arac;

    // Hangi Müşteri? (Kullanici tablosuyla ilişki)
    @ManyToOne
    @JoinColumn(name = "kullanici_id", nullable = false)
    private Kullanici kullanici;

    private LocalDate alisTarihi;
    private java.time.LocalTime alisSaati; // YENİ
    private LocalDate iadeTarihi;
    private java.time.LocalTime iadeSaati; // YENİ

    private BigDecimal toplamFiyat;

    // Durumlar: REZERVE, TESLIM_EDILDI, IADE_EDILDI, IPTAL
    private String durum;

    // Gecikme ve Ek Ücret
    private Integer gecikmeGunSayisi; // Gecikme gün sayısı (0 = gecikmesiz)
    private BigDecimal ekUcret; // Ek ücret (gecikme cezası)
    private LocalDate gercekIadeTarihi; // Gerçek iade tarihi

    // --- Getter ve Setter Metotları ---

    public Kiralama() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Arac getArac() {
        return arac;
    }

    public void setArac(Arac arac) {
        this.arac = arac;
    }

    public Kullanici getKullanici() {
        return kullanici;
    }

    public void setKullanici(Kullanici kullanici) {
        this.kullanici = kullanici;
    }

    public LocalDate getAlisTarihi() {
        return alisTarihi;
    }

    public void setAlisTarihi(LocalDate alisTarihi) {
        this.alisTarihi = alisTarihi;
    }

    public LocalDate getIadeTarihi() {
        return iadeTarihi;
    }

    public void setIadeTarihi(LocalDate iadeTarihi) {
        this.iadeTarihi = iadeTarihi;
    }

    public java.time.LocalTime getAlisSaati() {
        return alisSaati;
    }

    public void setAlisSaati(java.time.LocalTime alisSaati) {
        this.alisSaati = alisSaati;
    }

    public java.time.LocalTime getIadeSaati() {
        return iadeSaati;
    }

    public void setIadeSaati(java.time.LocalTime iadeSaati) {
        this.iadeSaati = iadeSaati;
    }

    public BigDecimal getToplamFiyat() {
        return toplamFiyat;
    }

    public void setToplamFiyat(BigDecimal toplamFiyat) {
        this.toplamFiyat = toplamFiyat;
    }

    public String getDurum() {
        return durum;
    }

    public void setDurum(String durum) {
        this.durum = durum;
    }

    public Integer getGecikmeGunSayisi() {
        return gecikmeGunSayisi;
    }

    public void setGecikmeGunSayisi(Integer gecikmeGunSayisi) {
        this.gecikmeGunSayisi = gecikmeGunSayisi;
    }

    public BigDecimal getEkUcret() {
        return ekUcret;
    }

    public void setEkUcret(BigDecimal ekUcret) {
        this.ekUcret = ekUcret;
    }

    public LocalDate getGercekIadeTarihi() {
        return gercekIadeTarihi;
    }

    public void setGercekIadeTarihi(LocalDate gercekIadeTarihi) {
        this.gercekIadeTarihi = gercekIadeTarihi;
    }
}