#!/bin/bash
set -e

echo "--- GÜNCELLEME BAŞLADI ---"

# 1. Kodları Çek
echo "Git Pull..."
git pull origin main

# 2. Java Projesini Derle
echo "Java Derleniyor..."
mvn clean package -DskipTests

# 3. Eski Java Sürecini Bul ve Öldür (pidof veya pgrep ile)
echo "Eski süreç durduruluyor..."
pkill -f 'java -jar' || echo "Çalışan java süreci bulunamadı."

# 4. Yeni Java Sürecini Başlat
echo "Yeni sürüm başlatılıyor..."
nohup java -jar target/*.jar > app.log 2>&1 &

echo "--- GÜNCELLEME TAMAMLANDI ---"
echo "Lütfen 1-2 dakika bekleyip kontrol edin."
