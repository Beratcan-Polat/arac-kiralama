package com.arackiralama.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "fiyat_politikalari")
public class FiyatPolitikasi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String aracSinifi; // Örn: Ekonomi, Lüks

    private BigDecimal minFiyat;
    private BigDecimal maxFiyat;

    public FiyatPolitikasi() {
    }

    public FiyatPolitikasi(String aracSinifi, BigDecimal minFiyat, BigDecimal maxFiyat) {
        this.aracSinifi = aracSinifi;
        this.minFiyat = minFiyat;
        this.maxFiyat = maxFiyat;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAracSinifi() {
        return aracSinifi;
    }

    public void setAracSinifi(String aracSinifi) {
        this.aracSinifi = aracSinifi;
    }

    public BigDecimal getMinFiyat() {
        return minFiyat;
    }

    public void setMinFiyat(BigDecimal minFiyat) {
        this.minFiyat = minFiyat;
    }

    public BigDecimal getMaxFiyat() {
        return maxFiyat;
    }

    public void setMaxFiyat(BigDecimal maxFiyat) {
        this.maxFiyat = maxFiyat;
    }
}
