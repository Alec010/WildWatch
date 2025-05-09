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

    @Query("SELECT ir.incident.submittedBy.id, ir.incident.submittedBy.firstName, ir.incident.submittedBy.lastName, COUNT(ir.id) as totalRatings, AVG(ir.reporterRating) as averageRating " +
           "FROM IncidentRating ir " +
           "WHERE ir.reporterRating IS NOT NULL " +
           "GROUP BY ir.incident.submittedBy.id, ir.incident.submittedBy.firstName, ir.incident.submittedBy.lastName " +
           "HAVING COUNT(ir.id) >= :minRatings " +
           "ORDER BY averageRating DESC")
    List<Object[]> getTopReporters(@Param("minRatings") int minRatings);

    @Query("SELECT ir.incident.assignedOffice, COUNT(ir.id) as totalRatings, AVG(ir.officeRating) as averageRating " +
           "FROM IncidentRating ir " +
           "WHERE ir.officeRating IS NOT NULL " +
           "GROUP BY ir.incident.assignedOffice " +
           "HAVING COUNT(ir.id) >= :minRatings " +
           "ORDER BY averageRating DESC")
    List<Object[]> getTopOffices(@Param("minRatings") int minRatings);
} 