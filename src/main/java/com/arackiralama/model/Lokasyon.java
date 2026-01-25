package com.arackiralama.model;

public class Lokasyon {
    private String sehir;
    private String ofisAdi;

    public Lokasyon(String sehir, String ofisAdi) {
        this.sehir = sehir;
        this.ofisAdi = ofisAdi;
    }

    public String getSehir() {
        return sehir;
    }

    public void setSehir(String sehir) {
        this.sehir = sehir;
    }

    public String getOfisAdi() {
        return ofisAdi;
    }

    public void setOfisAdi(String ofisAdi) {
        this.ofisAdi = ofisAdi;
    }
}
