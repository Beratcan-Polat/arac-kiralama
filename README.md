# Araç Kiralama Sistemi

Bu dalda rezervasyon onaylarını [HookDesk](https://github.com/Beratcan-Polat/HookDesk) üzerinden gönderen bir entegrasyon ekledim. Java tarafında kalıcı outbox, Python tarafında imzalı e-posta alıcısı kullandım; teslimatı ve iki servisin kesintiden toparlanmasını Docker üzerinde test ettim. Kurulum, kullanım ve test sonuçları [entegrasyon belgesinde](docs/hookdesk-integration.md). Ana uygulama sürümü `main` dalında duruyor.

Bir araç kiralama şirketinin günlük işini uçtan uca yürüten bir sistem: araç filosunun
tutulması, müşterinin araç arayıp rezervasyon yapması ve ödemesi, personelin aracı teslim
edip iade alması, yöneticinin fiyat politikası, bakım, duyuru ve ciro tarafını yönetmesi.
Aynı iş hem sunucuda üretilen bir web arayüzünden hem de ayrı bir mobil uygulamadan
yapılabiliyor; ikisi de aynı Spring Boot servis katmanına bağlanıyor. E-posta gönderimi
Java tarafında tutulmayıp kendi dilinde ayrı bir Python servisine, yapay zekâ yanıtları da
Google'ın Gemini API'sine bırakılmış durumda.

Ders projesi olarak yazıldı — **Java Programlama**, final sınavı yerine geçti.

## Üç parça

| Klasör | Ne | Teknoloji |
|---|---|---|
| `src/` | Backend: Thymeleaf web arayüzü + JWT korumalı REST API | Java 17, Spring Boot 3.2.1 |
| `arac-kiralama-mobil/` | Mobil istemci | Expo SDK 54, Expo Router 6, React Native 0.81, TypeScript |
| `mail-service/` | Bildirim (e-posta) servisi | Python, FastAPI, aiosmtplib |

Backend tek uygulama ama iki kapısı var:

- **Web** — `src/main/resources/templates/` altındaki 18 Thymeleaf şablonu Spring Boot'un
  içinden sunuluyor. Giriş form tabanlı, oturum çerezle taşınıyor
  (`WebGirisKontrol`, `WebAracKontrol`, `WebKiralamaKontrol`, `PanelKontrol`).
- **API** — `/api/**` altındaki uçlar `@RestController` sınıflarında. Giriş
  `POST /api/auth/giris` ile yapılıyor, dönen JWT sonraki isteklerde
  `Authorization: Bearer <token>` başlığında taşınıyor (`JwtFiltre`).

İkisi de aynı `SecurityFilterChain` içinde (`guvenlik/GuvenlikYapilandirmasi.java`) ve aynı
servis/veri katmanını paylaşıyor.

## Roller

Üç rol var (`model/Rol.java`): `MUSTERI`, `PERSONEL`, `ADMIN`. Web'de girişten sonra rol
başına farklı bir sayfaya yönlendiriliyor (`GirisBasariliHandler`); mobilde her rolün kendi
sekme grubu var (`app/(musteri)`, `app/(personel)`, `app/(admin)`).

**Müşteri** — araçları listeler ve filtreler, ofisleri (alış noktaları) görür, tarih aralığı
seçip rezervasyon yapar, ödeme adımını tamamlar, kendi kiralamalarını görüntüler ve iptal
eder, yapay zekâ asistanına soru sorar.

**Personel** — aktif kiralamaları görür, aracı müşteriye teslim eder, iadeyi alır (hasar
kaydı ve gecikme ücreti burada işleniyor), bekleyen rezervasyonları takip eder, bakım
kayıtlarını tamamlar, filoya araç ekler ve düzenler.

**Yönetici** — personelin yaptığı her şeye ek olarak kullanıcıların rolünü değiştirir, araç
sınıfı başına fiyat politikası (alt/üst sınır) tanımlar, duyuru ekler ve siler, personelin
eklediği araçları onaylar veya reddeder, ciro raporunu (gelir, gider, net kâr) görür.

## Gemini

`servis/GeminiService.java`, Google'ın `generativelanguage.googleapis.com` uç noktasına
`gemini-flash-latest` modeliyle istek atıyor. İki iş yapıyor:

- **Araç önerisi** (`POST /api/ai/oner`) — müşterinin serbest metinle yazdığı ihtiyaca
  (segment, kasa tipi, özellik) göre öneri üretiyor.
- **Müşteri desteği** (`POST /api/ai/destek`) — kiralama sorularını müşteri temsilcisi
  ağzıyla yanıtlıyor. Depozito aralığı ve gecikme ücreti kuralı istem şablonunun içinde
  yazılı.

Web'de `/ai-asistan` sayfası, mobilde müşteri sekmesindeki sohbet ekranı bu uçları
kullanıyor. Anahtar yoksa servis istek atmadan "yapılandırılmamış" yanıtı döndürüyor.

## Teknolojiler

**Backend:** Java 17 · Spring Boot 3.2.1 · Spring Security · Spring Data JPA · Thymeleaf ·
Spring WebFlux (`WebClient`) · jjwt 0.11.5 · MySQL

**Mobil:** Expo SDK 54 · Expo Router 6 · React Native 0.81 · React 19 · TypeScript 5.9 ·
axios · AsyncStorage · React Navigation (bottom tabs) · DateTimePicker

**Bildirim servisi:** Python · FastAPI · uvicorn · aiosmtplib · Pydantic

**Dağıtım:** AWS (Ubuntu) · MySQL · bash betikleri

## Çalıştırma

Üç parça birbirinden bağımsız çalışıyor. Sıra: önce MySQL ve bildirim servisi, sonra
backend, en son mobil.

### Backend

Java 17 ve MySQL gerekiyor. `src/main/resources/application.properties` depoda **yok**
(`.gitignore`'da); çalıştırmadan önce oluşturulmalı.

```bash
mvn spring-boot:run
# ya da paketleyip çalıştırmak için:
mvn clean package -DskipTests
java -jar target/*.jar
```

Varsayılan olarak 8080 portunda açılıyor. Açılışta `AracKiralamaApplication` içindeki
`CommandLineRunner` birkaç şema düzeltmesi yapıyor ve `VeriOnarici` durumu boş kalmış araç
kayıtlarını `MUSAIT` olarak düzeltiyor.

### Bildirim servisi

```bash
cd mail-service
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn aiosmtplib "pydantic[email]" email-validator python-dotenv
uvicorn main:app --host 0.0.0.0 --port 8000
```

Ayrı bir `requirements.txt` yok; yukarıdaki liste `deploy.sh`'in kurduğu paketlerin aynısı.
Servis tek uç sunuyor: `POST /send-mail`, gövdesi `{email, baslik, mesaj}`. Backend buraya
`MailServis` üzerinden yanıt beklemeden istek atıyor.

### Mobil istemci

```bash
cd arac-kiralama-mobil
npm install
npx expo start
```

`services/api.ts` içindeki `API_BASE_URL` sabiti backend'in adresine ayarlanmalı; şu anda
geliştirme sırasında kullanılan yerel ağ adresi yazılı. Android emülatöründe makinenin
kendisi `10.0.2.2` üzerinden görünüyor.

## Ortam değişkenleri ve yapılandırma

Değerler depoda yok, yalnızca adlar:

**`src/main/resources/application.properties`** (kodun okuduğu anahtarlar)

| Anahtar | Ne için |
|---|---|
| `spring.datasource.url` | MySQL bağlantı adresi |
| `spring.datasource.username` | Veri tabanı kullanıcısı |
| `spring.datasource.password` | Veri tabanı şifresi |
| `jwt.secret` | JWT imza anahtarı (Base64, HS256) |
| `gemini.api.key` | Google Gemini API anahtarı |
| `mail.service.url` | Bildirim servisinin adresi, ör. `http://localhost:8000` |

Bu dosya sürüm kontrolüne girmiyor, bu yüzden tam liste kaynaktan doğrulanamıyor;
tablodaki anahtarlar kodda doğrudan referans verilenler.

**`mail-service/.env`**

| Anahtar | Ne için |
|---|---|
| `MAIL_HOST` | SMTP sunucusu |
| `MAIL_PORT` | SMTP portu (varsayılan 587) |
| `MAIL_USER` | Gönderen hesap |
| `MAIL_PASS` | Hesabın şifresi / uygulama şifresi |

## Dağıtım

İki bash betiği var, ikisi de tek bir Ubuntu makinesi varsayıyor.

**`aws-setup.sh`** — makineyi bir kereliğine hazırlıyor: sistem paketlerini günceller,
OpenJDK 17, Python 3 (pip + venv), MySQL Server (systemd'ye kaydedilir) ve Git kurar, proje
klasörünü açar.

**`deploy.sh`** — her güncellemede çalışır: `git pull`, `mvn clean package -DskipTests`,
çalışan `java -jar` ve `uvicorn` süreçlerini durdurur, bildirim servisinin sanal ortamını
sıfırdan kurar, sonra ikisini de yeniden başlatır.

Ayakta duran **iki uygulama süreci** var: `java -jar` (8080) ve `uvicorn` (8000). MySQL
üçüncü bir süreç ama onu `deploy.sh` değil, `aws-setup.sh` sistem servisi olarak kaydediyor.
