package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.IncidentUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface IncidentUpdateRepository extends JpaRepository<IncidentUpdate, Long> {
    IncidentUpdate findFirstByIncidentAndStatusInOrderByUpdatedAtDesc(Incident incident, List<String> statuses);
    List<IncidentUpdate> findByIncidentOrderByUpdatedAtDesc(Incident incident);

    @Query("SELECT u FROM IncidentUpdate u WHERE u.incident.id IN :incidentIds AND u.updatedAt = (SELECT MAX(u2.updatedAt) FROM IncidentUpdate u2 WHERE u2.incident.id = u.incident.id)")
    List<IncidentUpdate> findLatestUpdatesForIncidents(@Param("incidentIds") List<String> incidentIds);
}