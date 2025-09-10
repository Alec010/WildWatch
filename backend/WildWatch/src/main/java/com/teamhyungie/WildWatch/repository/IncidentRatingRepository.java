package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.IncidentRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRatingRepository extends JpaRepository<IncidentRating, Long> {
    Optional<IncidentRating> findByIncidentId(String incidentId);

    @Query("SELECT AVG(r.reporterRating) FROM IncidentRating r WHERE r.reporterRating IS NOT NULL")
    Double getAverageReporterRating();

    @Query("SELECT AVG(r.officeRating) FROM IncidentRating r WHERE r.officeRating IS NOT NULL")
    Double getAverageOfficeRating();

    @Query("SELECT u.id, u.firstName, u.lastName, COUNT(i.id) as activeIncidents " +
           "FROM Incident i " +
           "JOIN i.submittedBy u " +
           "WHERE i.status = 'IN_PROGRESS' " +
           "GROUP BY u.id, u.firstName, u.lastName " +
           "ORDER BY activeIncidents DESC")
    List<Object[]> getMostActiveReporters();

    @Query("SELECT i.assignedOffice, COUNT(i.id) as resolvedIncidents " +
           "FROM Incident i " +
           "WHERE i.status = 'RESOLVED' " +
           "GROUP BY i.assignedOffice " +
           "ORDER BY resolvedIncidents DESC")
    List<Object[]> getMostActiveOffices();

    @Query("SELECT u.id, u.firstName, u.lastName, COUNT(i.id) as totalIncidents, " +
           "COALESCE(AVG(r.officeRating), 0) as avgRating, " +
           "COALESCE(u.points, 0) as points " +
           "FROM User u " +
           "LEFT JOIN Incident i ON i.submittedBy.id = u.id " +
           "LEFT JOIN IncidentRating r ON r.incident.id = i.id " +
           "WHERE u.points > 0 " +
           "GROUP BY u.id, u.firstName, u.lastName " +
           "ORDER BY points DESC " +
           "LIMIT 10")
    List<Object[]> getTopReporters();

    @Query("SELECT o.id, o.officeCode, COUNT(i.id) as totalIncidents, " +
           "COALESCE(AVG(r.reporterRating), 0) as avgRating, " +
           "COALESCE(o.points, 0) as points " +
           "FROM OfficeAdmin o " +
           "LEFT JOIN Incident i ON i.assignedOffice = o.officeCode " +
           "LEFT JOIN IncidentRating r ON r.incident.id = i.id " +
           "WHERE o.points > 0 " +
           "GROUP BY o.id, o.officeCode " +
           "ORDER BY points DESC " +
           "LIMIT 10")
    List<Object[]> getTopOffices();
} 