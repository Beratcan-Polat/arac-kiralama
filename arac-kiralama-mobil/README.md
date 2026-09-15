# Araç Kiralama — mobil istemci

Araç Kiralama sisteminin Expo ile yazılmış mobil istemcisi. Kendi başına çalışmıyor:
depo kökündeki Spring Boot uygulamasının `/api` uçlarına bağlanıyor, girişten sonra
dönen JWT'yi saklayıp her isteğe ekliyor ve müşteri, personel, yönetici rollerinin her
biri için ayrı bir sekme grubu açıyor (`app/(musteri)`, `app/(personel)`, `app/(admin)`).
Kurulum, çalıştırma ve backend adresinin nereden ayarlanacağı depo kökündeki
[README](../README.md) dosyasında anlatılıyor.

> `npm run reset-project` çalıştırmayın: `scripts/reset-project.js` Expo şablonundan
> geliyor ve `app/` klasörünü `app-example`'a taşıyıp yerine boş bir klasör açıyor,
> yani uygulamayı yerinden eder.
