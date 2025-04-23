package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {
    List<Incident> findBySubmittedByOrderBySubmittedAtDesc(User user);
    Optional<Incident> findByTrackingNumber(String trackingNumber);
    
    @Query("SELECT i FROM Incident i WHERE i.assignedOffice = :office ORDER BY i.submittedAt DESC")
    List<Incident> findByAssignedOfficeOrderBySubmittedAtDesc(@Param("office") Office office);
} 