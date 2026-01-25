package com.arackiralama.veritabani;

import com.arackiralama.model.Arac;
import com.arackiralama.model.AracDurum; // Enum importu
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AracRepository extends JpaRepository<Arac, Long> {
    
    // Müsait araçları getiren özel sorgu
    List<Arac> findByDurum(AracDurum durum);
}