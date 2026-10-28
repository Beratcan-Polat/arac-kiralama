# HookDesk ile rezervasyon bildirimi

Rezervasyon onayını Java, HookDesk ve Python arasında izlenebilir bir akışa taşıdım. Bu çalışma `feature/hookdesk-integration` dalındadır; araç kiralama deposunun `main` dalını değiştirmez.

## Akış

1. Müşteri mevcut web ekranından rezervasyon yapar.
2. Kiralama ve `rental.created` olayının değişmez JSON gövdesi aynı MySQL transaction'ında kaydedilir.
3. Outbox zamanlayıcısı commit edilmiş olayı sabit `Idempotency-Key` ile HookDesk'e gönderir.
4. HookDesk olayı PostgreSQL'e kaydeder, imzalı teslimatı kuyruğa alır ve hata durumunda yeniden dener.
5. Python ham gövdenin HMAC imzasını ve zamanını doğrular; rezervasyon e-postasını gönderir. Kalıcı SQLite kaydı normal tekrarları ve eşzamanlı işlemeyi önler.

Java tarafında `SENT`, HookDesk'in olayı kabul edip en az bir hedefe yönlendirdiğini gösterir. E-postanın sonucunu HookDesk teslimatından ve Mailpit'ten takip ederim. Hedef eşleşmezse outbox `UNROUTED`; kalıcı kabul hatalarında `FAILED` olur. Bu durumlar doğrudan e-posta gönderimine düşmez; yapılandırma incelenmelidir.

## Yerelde çalıştırma

Docker Desktop ve Node.js 24 gerekir. İki depo yan yana bulunmalıdır:

```text
New_Project/
  HookDesk/
  arac-kiralama-hookdesk/
```

Araç kiralama klasöründe:

```sh
node infra/hookdesk/demo.mjs setup
node infra/hookdesk/demo.mjs smoke
```

`setup` imajları derler, yalnızca demo veritabanlarında migration ve örnek kayıtları oluşturur. İlk derlemede bağımlılıklar indirilir. Farklı bir HookDesk konumu için ilk kurulumdan önce `HOOKDESK_PATH` ortam değişkenini belirtirim. Oluşturulan `.runtime/hookdesk/demo.env` dosyasını mevcut volume'lerle birlikte korurum; yeniden kurulumlarda anahtarlar ve parolalar değiştirilmez.

- HookDesk: <http://127.0.0.1:8090>
- Araç kiralama: <http://127.0.0.1:8091/giris>
- Demo e-posta kutusu: <http://127.0.0.1:8095>
- Hesaplar ve rastgele parolalar: `.runtime/hookdesk/giris-bilgileri.txt` — Git'e eklenmez.

Araç kiralamaya demo müşteriyle girip Renault Clio için birbirleriyle çakışmayan tarihlerde **Ofiste Öde** seçeneğiyle rezervasyon oluştururum. HookDesk panelinde **Araç Kiralama Demosu → Rezervasyon bildirimleri → Olaylar** üzerinden `rental.created` olayını ve teslimat denemelerini görebilirim. Mailpit gerçek alıcıya e-posta göndermez; deneme iletisini yerelde tutar.

```sh
node infra/hookdesk/demo.mjs status
node infra/hookdesk/demo.mjs stop
node infra/hookdesk/demo.mjs start
```

`stop` verileri silmez. `smoke` üç gerçek rezervasyon oluşturur: normal teslimat, alıcı kesintisinden kurtarma ve HookDesk kapalıyken outbox'ta bekleyen olayın kurtarılması. Kasıtlı olarak durdurduğu servisleri hata durumunda da yeniden açar. Sonuç `.runtime/hookdesk/smoke-report.json` dosyasına kaydedilir. Testi çalıştırırken aynı demoda elle rezervasyon oluşturulmamalıdır; e-posta sayısı da doğrulanır.

## İzolasyon ve güvenlik

Compose projesi `hookdesk-rental` adını kullanır. MySQL, PostgreSQL, Redis ve alıcı yalnızca demo ağındadır; mevcut projelerin verilerine bağlanmaz. `8090`, `8091`, `8095` yalnızca loopback üzerinde açılır. Yerel projedeki `.env`, `application.properties`, SQL yedeği ve gerçek müşteri kayıtları kopyalanmaz.

Yerel ağda gerçek uçtan uca testi, yalnızca bu demoya ait sabit **sistem test alıcısı** üzerinden yaparım. Python yalnızca kurulumun belirlediği hedef kimliğini kabul eder. HookDesk'in HTTPS hedeflerindeki SSRF, DNS ve TLS kontrollerini değiştirmedim. Bu profil gerçek HTTPS teslimatının veya canlı dağıtımın doğrulaması değildir. Canlı kullanımda Python'un `/webhooks/hookdesk` ucu herkese açık HTTPS/443 arkasında, yeni hedef ve imza sırrıyla yapılandırılır; demo alıcı yolu kapatılır.

İlk kapsam rezervasyon onayıdır. Karşılama, teslim ve iade e-postaları mevcut doğrudan servis yolunda kalır; yerel demoda ayrı `mail-legacy` süreci bunları da Mailpit'e gönderir. Mobil uygulama değiştirilmedi.

Outbox otomatik tekrarları 24 saatlik idempotency penceresinden önce durur. Bu sınır geçtikten sonra yeni anahtarla körlemesine tekrar göndermem; kabul ve teslimat kayıtlarını inceleyerek iş etkisini uzlaştırırım. SMTP ile SQLite arasında ortak transaction olmadığı için SMTP kabulünden hemen sonraki süreç çökmesinde e-posta tekrarı mümkündür; mutlak tek gönderim garantisi verilmez.

## Kaynak sürüm karşılaştırması

28 Ekim 2026'da yereldeki `arac-kiralama_v2` ile GitHub `main` (`6844512`) karşılaştırıldı. Java kaynakları, şablonlar, POM ve Python servisi kapsamında 60 dosya aynı, 13 dosya farklı; GitHub'daki `MailDTO` ve `ZamanlanmisGorevServisi` yerelde yoktu. GitHub sürümü Python servis bağlantısı, karşılama/teslim/iade bildirimleri, gecikme görevi ve kısmi araç güncellemesini içeriyordu. Yerelde farklı Gemini model seçimi, sohbet görünümü ve araç detayını açan `toggleDetay` işlevi vardı. Bu farklılıklar tek bir sürümün her açıdan daha güncel olduğunu göstermiyor.

Entegrasyonda GitHub sürümü temel alındı. Yerel klasör ve GitHub `main` değiştirilmedi; arayüz farkları bu bağlantıyla ilgisiz olduğu için topluca taşınmadı. Yerel karşılaştırma listesi `.runtime/hookdesk/local-comparison.json` içindedir.

## Testler

28 Ekim 2026: Java tarafında 17, Python tarafında 38 test geçti. Docker uçtan uca senaryoları henüz çalıştırılamadı: ilk imaj derlemesi sırasında Windows sistem diskinde boş alan tükendi ve derleme durduruldu. Aşağıdaki smoke komutu ve demo profili bu doğrulama tamamlanana kadar geliştirme aşamasındadır. `setup` Windows kullanıcı diskinde 2 GiB'dan az alan varsa başlamaz; indirilecek imajlar ve derleme önbelleği için ayrıca alan gerekir.

```sh
mvn -B test
python -m pip install -r mail-service/requirements-test.txt
python -m pytest mail-service/tests -q
node infra/hookdesk/demo.mjs smoke
```

Java testleri bağımsız H2 kullanır; gerçek MySQL, PostgreSQL, Redis ve HTTP/SMTP akışı Docker smoke testiyle doğrulanır. İmza, gövde sınırı, zaman toleransı, kalıcı tekrar koruması, HTTP zaman aşımı, transaction geri alma ve sahiplik yarışları ayrıca test edilir.
