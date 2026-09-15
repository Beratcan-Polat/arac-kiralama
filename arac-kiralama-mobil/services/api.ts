import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ngrok URL'inizi buraya yapıştırın
// Örnek: https://abc123.ngrok.io
export const API_BASE_URL = 'http://10.156.50.181:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // ngrok ücretsiz plan uyarısını atla
  },
});

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      console.log('API Request: Token ekleniyor ->', token.substring(0, 10) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('API Request: Token BULUNAMADI!');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz, kullanıcıyı çıkış yaptır
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authAPI = {
  giris: (email: string, sifre: string) =>
    api.post('/api/auth/giris', { email, sifre }),
  kayit: (ad: string, email: string, sifre: string) =>
    api.post('/api/auth/kayit', { ad, email, sifre }),
};

// ===== ARAÇ API =====
export const aracAPI = {
  tumAraclar: () => api.get('/api/araclar'),
  musaitAraclar: () => api.get('/api/araclar/musait'),
  lokasyonlar: () => api.get('/api/lokasyonlar'),
  aracAra: (params: { alisYeri?: string; alisTarihi?: string; iadeTarihi?: string }) =>
    api.get('/api/araclar/ara', { params }),
};

// ===== KİRALAMA API =====
export const kiralamaAPI = {
  kiralamaOlustur: (data: {
    aracId: number;
    kullaniciId: number;
    alisTarihi: string;
    iadeTarihi: string;
    odemeTipi?: string;
  }) => api.post('/api/kiralamalar', data),
  gecmisKiralamalar: (kullaniciId: number) =>
    api.get('/api/kiralamalar/gecmis', { params: { kullaniciId } }),
  kiralamaIptal: (id: number) => api.post(`/api/kiralamalar/iptal/${id}`),
};

// ===== AI API =====
export const aiAPI = {
  aracOner: (istek: string) => api.post('/api/ai/oner', { istek }),
  destekSorusu: (soru: string) => api.post('/api/ai/destek', { soru }),
};

// ===== DUYURU API =====
export const duyuruAPI = {
  tumDuyurular: () => api.get('/api/duyurular'),
};

// ===== PERSONEL API =====
export const personelAPI = {
  dashboard: () => api.get('/api/personel/dashboard'),
  aktifKiralamalar: () => api.get('/api/personel/aktif-kiralamalar'),
  teslimEt: (kiralamaId: number) => api.post(`/api/personel/teslim/${kiralamaId}`),
  iadeAl: (kiralamaId: number, hasarli: boolean, hasarAciklamasi?: string) =>
    api.post(`/api/personel/iade/${kiralamaId}`, { hasarli, hasarAciklamasi }),
  bakimlar: () => api.get('/api/personel/bakimlar'),
  bakimTamamla: (bakimId: number, masraf: number) =>
    api.post(`/api/personel/bakim/${bakimId}/tamamla`, { masraf }),
  rezervasyonlar: () => api.get('/api/personel/rezervasyonlar'),
};

// ===== ADMIN API =====
export const adminAPI = {
  // Ciro ve istatistikler
  ciro: () => api.get('/api/admin/ciro'),
  istatistikler: () => api.get('/api/admin/istatistikler'),

  // Kullanıcı yönetimi
  kullanicilar: () => api.get('/api/admin/kullanicilar'),
  rolGuncelle: (userId: number, rol: string) =>
    api.put(`/api/admin/kullanici/${userId}/rol`, { rol }),

  // Duyuru yönetimi
  duyurular: () => api.get('/api/admin/duyurular'),
  duyuruEkle: (baslik: string, icerik: string) =>
    api.post('/api/admin/duyuru', { baslik, icerik }),
  duyuruSil: (id: number) => api.delete(`/api/admin/duyuru/${id}`),

  // Fiyat politikası
  fiyatPolitikalari: () => api.get('/api/admin/fiyat-politikalari'),
  fiyatPolitikasiEkle: (aracSinifi: string, minFiyat: number, maxFiyat: number) =>
    api.post('/api/admin/fiyat-politikasi', { aracSinifi, minFiyat, maxFiyat }),
  fiyatPolitikasiGuncelle: (id: number, minFiyat: number, maxFiyat: number) =>
    api.put(`/api/admin/fiyat-politikasi/${id}`, { minFiyat, maxFiyat }),
  fiyatPolitikasiSil: (id: number) => api.delete(`/api/admin/fiyat-politikasi/${id}`),

  // Araç yönetimi
  aracEkle: (arac: any) => api.post('/api/araclar', arac),
  aracGuncelle: (id: number, arac: any) => api.put(`/api/araclar/${id}`, arac),
  aracSil: (id: number, zorla?: boolean, silinmeSebebi?: string) =>
    api.delete(`/api/araclar/${id}`, { params: { zorla, silinmeSebebi } }),

  // Araç Onay Yönetimi
  onayBekleyenAraclar: () => api.get('/api/admin/onay-bekleyenler'),
  aracOnayla: (id: number) => api.post(`/api/admin/arac-onayla/${id}`),
  aracReddet: (id: number) => api.post(`/api/admin/arac-reddet/${id}`),
};

export default api;
