package com.arackiralama.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "bakimlar")
public class Bakim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "arac_id", nullable = false)
    private Arac arac;

    private String aciklama; // Hasar/Bakım nedeni
    private BigDecimal masraf; // Tamir tutarı (Admin girecek)

    private LocalDate baslangicTarihi;
    private LocalDate bitisTarihi;

    private boolean aktif = true; // true: Şu an bakımda, false: Bakım bitti

    // Getter & Setter
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

    public String getAciklama() {
        return aciklama;
    }

    public void setAciklama(String aciklama) {
        this.aciklama = aciklama;
    }

    public BigDecimal getMasraf() {
        return masraf;
    }

    public void setMasraf(BigDecimal masraf) {
        this.masraf = masraf;
    }

    public LocalDate getBaslangicTarihi() {
        return baslangicTarihi;
    }

    public void setBaslangicTarihi(LocalDate baslangicTarihi) {
        this.baslangicTarihi = baslangicTarihi;
    }

    public LocalDate getBitisTarihi() {
        return bitisTarihi;
    }

    public void setBitisTarihi(LocalDate bitisTarihi) {
        this.bitisTarihi = bitisTarihi;
    }

    public boolean isAktif() {
        return aktif;
    }

    public void setAktif(boolean aktif) {
        this.aktif = aktif;
    }
}
