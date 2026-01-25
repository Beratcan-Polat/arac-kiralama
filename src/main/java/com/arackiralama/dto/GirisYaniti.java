package com.arackiralama.dto;

import com.arackiralama.model.Rol;

public class GirisYaniti {
    private String token;
    private String mesaj;
    private Long kullaniciId;
    private String ad;
    private Rol rol;

    // Eski constructor (geriye uyumluluk için)
    public GirisYaniti(String token, String mesaj) {
        this.token = token;
        this.mesaj = mesaj;
    }

    // Yeni constructor (mobil için)
    public GirisYaniti(String token, String mesaj, Long kullaniciId, String ad, Rol rol) {
        this.token = token;
        this.mesaj = mesaj;
        this.kullaniciId = kullaniciId;
        this.ad = ad;
        this.rol = rol;
    }

    // Getter ve Setter
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getMesaj() {
        return mesaj;
    }

    public void setMesaj(String mesaj) {
        this.mesaj = mesaj;
    }

    public Long getKullaniciId() {
        return kullaniciId;
    }

    public void setKullaniciId(Long kullaniciId) {
        this.kullaniciId = kullaniciId;
    }

    public String getAd() {
        return ad;
    }

    public void setAd(String ad) {
        this.ad = ad;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }
}