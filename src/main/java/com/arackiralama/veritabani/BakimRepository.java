package com.arackiralama.veritabani;

import com.arackiralama.model.Bakim;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BakimRepository extends JpaRepository<Bakim, Long> {
    List<Bakim> findByAktifTrue(); // Şu an bakımda olan araçları getir
}
