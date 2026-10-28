package com.arackiralama.hookdesk;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HookDeskOutboxRepository extends JpaRepository<HookDeskOutboxEvent, String> {
    @Query("select e.id from HookDeskOutboxEvent e where "
            + "(e.status = :pending and e.nextAttemptAt <= :now) or "
            + "(e.status = :processing and e.lockedUntil <= :now) "
            + "order by e.createdAt, e.id")
    List<String> findDueIds(@Param("now") Instant now, @Param("pending") HookDeskOutboxEvent.Status pending,
            @Param("processing") HookDeskOutboxEvent.Status processing, Pageable page);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from HookDeskOutboxEvent e where e.id = :id")
    Optional<HookDeskOutboxEvent> lockById(@Param("id") String id);
}
