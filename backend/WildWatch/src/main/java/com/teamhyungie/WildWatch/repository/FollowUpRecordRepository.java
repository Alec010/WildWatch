package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.FollowUpRecord;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface FollowUpRecordRepository extends JpaRepository<FollowUpRecord, Long> {
    
    /**
     * Find the most recent follow-up record for a specific user and incident
     */
    Optional<FollowUpRecord> findTopByUserAndIncidentOrderByCreatedAtDesc(User user, Incident incident);
    
    /**
     * Check if a user has sent a follow-up for an incident within the specified time period
     */
    @Query("SELECT COUNT(f) > 0 FROM FollowUpRecord f WHERE f.user = :user AND f.incident = :incident AND f.createdAt > :since")
    boolean existsByUserAndIncidentAndCreatedAtAfter(@Param("user") User user, @Param("incident") Incident incident, @Param("since") LocalDateTime since);
}
