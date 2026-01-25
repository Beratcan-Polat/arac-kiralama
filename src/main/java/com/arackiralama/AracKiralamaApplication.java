package com.arackiralama;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AracKiralamaApplication {

	public static void main(String[] args) {
		SpringApplication.run(AracKiralamaApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner dbFix(
			org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				// Enum alanı yeni değerleri (PASIF, vs.) kabul etmiyor olabilir.
				// Bu yüzden VARCHAR(50) yaparak genişletiyoruz.
				jdbcTemplate.execute("ALTER TABLE araclar MODIFY COLUMN durum VARCHAR(50)");

				try {
					jdbcTemplate.execute("ALTER TABLE araclar ADD COLUMN plaka VARCHAR(20)");
				} catch (Exception ex) {
					// Zaten varsa hata verir, yutalım.
				}

				// Fiyat Politikası Tablosu Yoksa Oluştur (Basit kontrol)
				try {
					jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS fiyat_politikalari ("
							+ "id BIGINT AUTO_INCREMENT PRIMARY KEY, "
							+ "arac_sinifi VARCHAR(255) NOT NULL UNIQUE, "
							+ "min_fiyat DECIMAL(19,2), "
							+ "max_fiyat DECIMAL(19,2))");

					// Varsayılan Ekonomi Politikası Ekle (Yoksa)
					Integer count = jdbcTemplate.queryForObject(
							"SELECT COUNT(*) FROM fiyat_politikalari WHERE arac_sinifi = 'Ekonomi'", Integer.class);
					if (count == null || count == 0) {
						jdbcTemplate.execute(
								"INSERT INTO fiyat_politikalari (arac_sinifi, min_fiyat, max_fiyat) VALUES ('Ekonomi', 1000.00, 2000.00)");
						System.out.println("POLICY SEED: Ekonomi politikasi eklendi.");
					}
				} catch (Exception e) {
					System.out.println("POLICY SEED ERROR: " + e.getMessage());
				}

				System.out.println("VERITABANI DUZELTME: Araclar tablosu guncellendi.");
			} catch (Exception e) {
				// Hata olursa (zaten güncelse vs.) yut, devam et.
				System.out.println("VERITABANI DUZELTME GECILDI: " + e.getMessage());
			}
		};
	}
}
