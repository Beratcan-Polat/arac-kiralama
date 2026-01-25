package com.arackiralama.dto;

import java.time.LocalDate;

public class KiralamaIstegi {
    private Long aracId;
    // Eğer mobil uygulamada Token kullanıyorsak kullanıcı ID'sine gerek kalmaz
    // ama şimdilik işi kolaylaştırmak için manuel gönderelim:
    private Long kullaniciId;

    private LocalDate alisTarihi;
    private java.time.LocalTime alisSaati; // YENİ
    private LocalDate iadeTarihi;
    private java.time.LocalTime iadeSaati; // YENİ

    // Getter ve Setterlar
    public Long getAracId() {
        return aracId;
    }

    public void setAracId(Long aracId) {
        this.aracId = aracId;
    }

    public Long getKullaniciId() {
        return kullaniciId;
    }

    public void setKullaniciId(Long kullaniciId) {
        this.kullaniciId = kullaniciId;
    }

    private String odemeTipi;

    public String getOdemeTipi() {
        return odemeTipi;
    }

    public void setOdemeTipi(String odemeTipi) {
        this.odemeTipi = odemeTipi;
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
}