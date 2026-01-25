#!/bin/bash
set -e

echo "--- GÜNCELLEME BAŞLADI ---"

# 1. Kodları Çek
echo "Git Pull..."
git pull origin main

# 2. Java Projesini Derle
echo "Java Derleniyor..."
mvn clean package -DskipTests

# 3. Eski Süreçleri Durdur
echo "Eski süreçler durduruluyor..."
pkill -f 'java -jar' || echo "Java süreci yok."
pkill -f 'uvicorn' || echo "Python süreci yok."

# 4. Python Servisini Başlat
echo "Python Mail Servisi başlatılıyor..."
cd mail-service
# Venv temiz kurulum
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn aiosmtplib "pydantic[email]" email-validator python-dotenv

nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../mail.log 2>&1 &
cd ..

# 5. Yeni Java Sürecini Başlat
echo "Yeni Java sürümü başlatılıyor..."
nohup java -jar target/*.jar > app.log 2>&1 &

echo "--- GÜNCELLEME TAMAMLANDI ---"
echo "Lütfen 1-2 dakika bekleyip kontrol edin."
