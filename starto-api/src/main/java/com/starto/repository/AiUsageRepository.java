package com.starto.repository;

import com.starto.model.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiUsageRepository extends JpaRepository<AiUsage, UUID> {

    Optional<AiUsage> findByUserIdAndDate(UUID userId, LocalDate date);

    @Query("SELECT COALESCE(SUM(a.usedCount), 0) FROM AiUsage a WHERE a.userId = :userId")
    int getTotalUsageByUserId(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(a.usedCount), 0) FROM AiUsage a WHERE a.userId = :userId AND a.date >= :startDate")
    long countByUserIdAndDateAfter(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate);
}