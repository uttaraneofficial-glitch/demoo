package com.starto.repository;

import com.starto.model.EventStartup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventStartupRepository extends JpaRepository<EventStartup, Long> {
    Optional<EventStartup> findBySlug(String slug);
}
