package com.arackiralama.model;

import jakarta.persistence.*;

@Entity
@Table(name = "kullanicilar")
public class Kullanici {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ad;

    @Column(unique = true)
    private String email;

    private String sifre;

    @Enumerated(EnumType.STRING)
    private Rol rol;

    // --- Kurucu Metotlar (Constructors) ---

    // 1. Boş Kurucu Metot (JPA için zorunludur)
    public Kullanici() {
    }

    // 2. Dolu Kurucu Metot (Nesne oluştururken kolaylık sağlar)
    public Kullanici(String ad, String email, String sifre, Rol rol) {
        this.ad = ad;
        this.email = email;
        this.sifre = sifre;
        this.rol = rol;
    }

    // --- Getter ve Setter Metotları ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAd() {
        return ad;
    }

    public void setAd(String ad) {
        this.ad = ad;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSifre() {
        return sifre;
    }

    public void setSifre(String sifre) {
        this.sifre = sifre;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }
}