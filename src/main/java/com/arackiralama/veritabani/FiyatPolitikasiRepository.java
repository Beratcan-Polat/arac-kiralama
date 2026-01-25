package com.arackiralama.veritabani;

import com.arackiralama.model.FiyatPolitikasi;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FiyatPolitikasiRepository extends JpaRepository<FiyatPolitikasi, Long> {
    Optional<FiyatPolitikasi> findByAracSinifi(String aracSinifi);
}
