package com.arackiralama.veritabani;

import com.arackiralama.model.Duyuru;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DuyuruRepository extends JpaRepository<Duyuru, Long> {
    // Tarihe göre tersten sırala (en yeni en üstte)
    List<Duyuru> findAllByOrderByTarihDesc();
}
