#!/bin/bash

# Hata durumunda dur
set -e

echo "--- AWS Sunucu Kurulumu Başlıyor ---"

# 1. Sistemi Güncelle
echo "[1/6] Sistem paketleri güncelleniyor..."
sudo apt update && sudo apt upgrade -y

# 2. Java 17 Kurulumu (Spring Boot İçin)
echo "[2/6] Java 17 (OpenJDK) kuruluyor..."
sudo apt install -y openjdk-17-jre-headless
java -version

# 3. Python ve Gerekli Araçlar (Mail Servisi İçin)
echo "[3/6] Python 3, Pip ve Venv kuruluyor..."
sudo apt install -y python3 python3-pip python3-venv

# 4. MySQL Server Kurulumu
echo "[4/6] MySQL Server kuruluyor..."
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# 5. Git Kurulumu
echo "[5/6] Git kuruluyor..."
sudo apt install -y git

# 6. Proje Klasörü Hazırlığı
echo "[6/6] Proje klasörü oluşturuluyor..."
mkdir -p ~/arac-kiralama

echo "--- Kurulum Tamamlandı! ---"
echo "Lütfen MySQL güvenlik ayarlarını ve veritabanı/kullanıcı oluşturma işlemlerini yapmayı unutmayın."
