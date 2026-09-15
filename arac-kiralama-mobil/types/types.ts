// Rol enum
export type Rol = 'ADMIN' | 'PERSONEL' | 'MUSTERI';

// Araç durumu enum
export type AracDurum = 'MUSAIT' | 'KIRADA' | 'BAKIMDA';

// Kullanıcı tipi
export interface Kullanici {
    id: number;
    ad: string;
    email: string;
    rol: Rol;
}

// Auth yanıt tipi
export interface GirisYaniti {
    token: string;
    mesaj: string;
    kullaniciId: number;
    ad: string;
    rol: Rol;
}

// Araç tipi
export interface Arac {
    id: number;
    marka: string;
    model: string;
    plaka: string;
    il: string;
    alisNoktasi: string;
    gunlukFiyat: number;
    yakitTipi: string;
    vitesTipi: string;
    aracSinifi: string;
    kasaTipi: string;
    minYas: number;
    minGencYas: number;
    minEhliyetYili: number;
    minGencEhliyetYili: number;
    gunlukKmLimiti: number;
    teminatTutari: number;
    resimUrl: string;
    aciklama: string;
    durum: AracDurum;
    silindi: boolean;
}

// Kiralama tipi
export interface Kiralama {
    id: number;
    arac: Arac;
    kullanici: Kullanici;
    alisTarihi: string;
    iadeTarihi: string;
    toplamFiyat: number;
    durum: string;
    gecikmeGunSayisi: number;
    ekUcret: number;
    gercekIadeTarihi: string;
}

// Bakım tipi
export interface Bakim {
    id: number;
    arac: Arac;
    aciklama: string;
    masraf: number;
    baslangicTarihi: string;
    bitisTarihi: string;
    aktif: boolean;
}

// Duyuru tipi
export interface Duyuru {
    id: number;
    baslik: string;
    icerik: string;
    tarih: string;
}

// Fiyat politikası tipi
export interface FiyatPolitikasi {
    id: number;
    aracSinifi: string;
    minFiyat: number;
    maxFiyat: number;
}

// Ciro raporu tipi
export interface CiroRaporu {
    toplamCiro: number;
    aylikCiro: number;
    toplamKiralama: number;
}
