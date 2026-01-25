package com.arackiralama.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "duyurular")
public class Duyuru {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String baslik;

    @Column(length = 2000)
    private String icerik;

    private LocalDateTime tarih;

    // Getter & Setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBaslik() {
        return baslik;
    }

    public void setBaslik(String baslik) {
        this.baslik = baslik;
    }

    public String getIcerik() {
        return icerik;
    }

    public void setIcerik(String icerik) {
        this.icerik = icerik;
    }

    public LocalDateTime getTarih() {
        return tarih;
    }

    public void setTarih(LocalDateTime tarih) {
        this.tarih = tarih;
    }
}
