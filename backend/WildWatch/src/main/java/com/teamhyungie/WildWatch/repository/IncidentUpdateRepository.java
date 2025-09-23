package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.IncidentUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentUpdateRepository extends JpaRepository<IncidentUpdate, Long> {
    IncidentUpdate findFirstByIncidentAndStatusInOrderByUpdatedAtDesc(Incident incident, List<String> statuses);
    List<IncidentUpdate> findByIncidentOrderByUpdatedAtDesc(Incident incident);
}

package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.IncidentUpdate;
import com.teamhyungie.WildWatch.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentUpdateRepository extends JpaRepository<IncidentUpdate, Long> {
    List<IncidentUpdate> findByIncidentOrderByUpdatedAtDesc(Incident incident);

    // Find the latest update for an incident with a given status
    IncidentUpdate findFirstByIncidentAndStatusInOrderByUpdatedAtDesc(Incident incident, List<String> statuses);
} 