# E-posta servisi

Varsayılan kurulumda Java'nın kullandığı `POST /send-mail` uç noktasını korudum.
HookDesk entegrasyonunu `HOOKDESK_ENABLED=true` ile açtığımda bu imzasız uç kapanır;
rezervasyon onayları yalnızca `POST /webhooks/hookdesk` üzerinden kabul edilir.

```bash
python -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --no-access-log
```

Yapılandırma alanları `.env.example` içinde. İmza sırrı, HookDesk hedefi oluşturulurken
bir kez gösterilen sırdır. Gerçek SMTP için `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM` ve
gerekiyorsa `MAIL_USER`/`MAIL_PASS` tanımlanır. STARTTLS varsayılan olarak açıktır;
Mailpit gibi yalıtılmış geliştirme alıcılarında `MAIL_START_TLS=false` kullanılır.
Örtük TLS gerekiyorsa `MAIL_USE_TLS=true`, `MAIL_START_TLS=false` seçilir.

HookDesk imzasını ham istek gövdesiyle doğruladım. Zaman damgasında beş dakikalık
tolerans uygulanır; gövde 256 KiB ile sınırlıdır. Olay türü `rental.created`, sürüm
`1` olmalıdır. Müşteri, araç, tarih ve tutar bilgileri doğrulandıktan sonra Türkçe
rezervasyon onayı hazırlanır. Geçersiz imza `401`, geçersiz olay `422`, aynı kimlikle
değişen içerik `409`, geçici alıcı/SMTP sorunu `503` döndürür.

Olay kimliğini ve gövde özetini SQLite dosyasında sakladım; müşteri bilgilerini bu
tabloya kopyalamıyorum. `HOOKDESK_RECEIPTS_DB` kalıcı bir diskte olmalıdır. Normal
tekrarlar ikinci e-posta üretmez, eşzamanlı istekte yalnızca bir süreç gönderimi
üstlenir. Otuz saniyelik sahiplik süresi dolduğunda yarım kalmış işlem tekrar
alınabilir. SMTP kabulünden sonra, kayıt tamamlanmadan süreç kapanırsa e-posta
yeniden gönderilebilir. Sabit `Message-ID` izlemeyi kolaylaştırır; tek gönderim
garantisi sağlamaz. SQLite dosyasını silmek tekrar korumasını da siler.

`GET /health`, yapılandırma ve SQLite erişimini kontrol eder. SMTP sunucusuna test
e-postası göndermez; gerçek SMTP erişimi teslimat sırasında doğrulanır.

Yerel Docker demosunda `HOOKDESK_DEMO=true` ve önceden tanımlanmış
`HOOKDESK_DEMO_ENDPOINT_ID` ile `/receive/{endpoint_id}` açılır. Bu, HookDesk'in
sistem tarafından üretilen test hedefinin sabit adresidir. Kullanıcıların iç ağ
adresleri girmesine izin vermez. `HOOKDESK_DEMO_FAILURES=2`, her olayın ilk iki
isteğini geçici hatayla bitirir; sayaç yeniden başlatmada korunur. Gerçek kurulumda
demo modu kapalı kalır ve HTTPS adresi olarak `/webhooks/hookdesk` kullanılır.

```bash
python -m pip install -r requirements-test.txt
python -m pytest -q
```
