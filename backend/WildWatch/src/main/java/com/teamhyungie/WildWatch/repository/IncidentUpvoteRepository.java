package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.IncidentUpvote;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IncidentUpvoteRepository extends JpaRepository<IncidentUpvote, String> {
    Optional<IncidentUpvote> findByIncidentAndUser(Incident incident, User user);
    boolean existsByIncidentAndUser(Incident incident, User user);
    long countByIncident(Incident incident);
} 