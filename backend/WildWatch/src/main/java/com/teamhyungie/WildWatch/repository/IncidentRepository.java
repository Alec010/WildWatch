package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.QueryHint;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {
    List<Incident> findBySubmittedByOrderBySubmittedAtDesc(User user);
    Optional<Incident> findByTrackingNumber(String trackingNumber);
    
    @Query("SELECT i FROM Incident i WHERE i.assignedOffice = :office ORDER BY i.submittedAt DESC")
    List<Incident> findByAssignedOfficeOrderBySubmittedAtDesc(@Param("office") Office office);

    @Query("SELECT i FROM Incident i WHERE i.assignedOffice = :office AND i.status = :status ORDER BY i.submittedAt DESC")
    List<Incident> findByAssignedOfficeAndStatusOrderBySubmittedAtDesc(@Param("office") Office office, @Param("status") String status);

    @Query("SELECT i FROM Incident i WHERE (LOWER(i.status) = 'resolved' OR LOWER(i.status) = 'closed') AND i.resolutionNotes IS NOT NULL AND TRIM(i.resolutionNotes) <> ''")
    List<Incident> findResolvedWithResolutionNotes();

    /**
     * Count total upvotes received by a user's incidents
     * @param user The user who submitted the incidents
     * @return Total count of upvotes across all incidents
     */
    @Query("SELECT COALESCE(SUM(i.upvoteCount), 0) FROM Incident i WHERE i.submittedBy = :user")
    Integer countTotalUpvotesByUser(@Param("user") User user);
    
    @Query("SELECT i FROM Incident i WHERE (LOWER(i.status) = 'resolved' OR LOWER(i.status) = 'closed') AND i.resolutionNotes IS NOT NULL AND TRIM(i.resolutionNotes) <> '' ORDER BY i.submittedAt DESC")
    List<Incident> findResolvedWithResolutionNotesOrderBySubmittedAtDesc();
    
    List<Incident> findByStatus(String status);
    
    /**
     * Optimized query for dashboard that fetches only the necessary fields for display
     * and joins the submitter information to avoid N+1 queries
     */
    @Query("SELECT new com.teamhyungie.WildWatch.dto.IncidentResponse(" +
           "i.id, i.trackingNumber, i.incidentType, i.location, i.status, " +
           "i.description, i.submittedAt, i.upvoteCount, " +
           "u.firstName, u.lastName, u.email) " +
           "FROM Incident i JOIN i.submittedBy u " +
           "WHERE u = :user " +
           "ORDER BY i.submittedAt DESC")
    List<com.teamhyungie.WildWatch.dto.IncidentResponse> findDashboardIncidentsByUser(@Param("user") User user);
    
    /**
     * Optimized query for office admin dashboard that fetches only the necessary fields
     */
    @Query("SELECT new com.teamhyungie.WildWatch.dto.IncidentResponse(" +
           "i.id, i.trackingNumber, i.incidentType, i.location, i.status, " +
           "i.description, i.submittedAt, i.upvoteCount, " +
           "u.firstName, u.lastName, u.email) " +
           "FROM Incident i JOIN i.submittedBy u " +
           "WHERE i.assignedOffice = :office " +
           "ORDER BY i.submittedAt DESC")
    List<com.teamhyungie.WildWatch.dto.IncidentResponse> findDashboardIncidentsByOffice(@Param("office") Office office);
    
    /**
     * Optimized query for office admin incident management page that includes transfer information
     */
    @Query("SELECT new com.teamhyungie.WildWatch.dto.IncidentResponse(" +
           "i.id, i.trackingNumber, i.incidentType, i.location, i.status, " +
           "i.description, i.submittedAt, i.dateOfIncident, i.timeOfIncident, " +
           "u.firstName, u.lastName, u.email, i.transferredFrom, i.lastTransferredTo, i.lastTransferNotes, i.priorityLevel) " +
           "FROM Incident i JOIN i.submittedBy u " +
           "WHERE i.assignedOffice = :office " +
           "ORDER BY i.submittedAt DESC")
    List<com.teamhyungie.WildWatch.dto.IncidentResponse> findOfficeAdminIncidents(@Param("office") Office office);
    
    /**
     * Optimized query for verified cases tracker
     */
    @Query("SELECT new com.teamhyungie.WildWatch.dto.IncidentResponse(" +
           "i.id, i.trackingNumber, i.incidentType, i.location, i.status, " +
           "i.description, i.submittedAt, i.dateOfIncident, i.timeOfIncident, " +
           "u.firstName, u.lastName, u.email, i.verified, i.priorityLevel) " +
           "FROM Incident i JOIN i.submittedBy u " +
           "WHERE i.assignedOffice = :office AND i.verified = true " +
           "ORDER BY i.submittedAt DESC")
    List<com.teamhyungie.WildWatch.dto.IncidentResponse> findVerifiedCases(@Param("office") Office office);
    
    /**
     * Optimized query for case tracking page - returns only active cases (pending/in progress)
     * Uses query cache with name "activeCases"
     */
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "activeCases")
    })
    @Query("SELECT new com.teamhyungie.WildWatch.dto.IncidentResponse(" +
           "i.id, i.trackingNumber, i.incidentType, i.location, i.status, " +
           "i.description, i.submittedAt, i.dateOfIncident, i.timeOfIncident, " +
           "i.priorityLevel) " +
           "FROM Incident i " +
           "WHERE i.submittedBy = :user AND LOWER(i.status) IN ('pending', 'in progress') " +
           "ORDER BY i.submittedAt DESC")
    List<com.teamhyungie.WildWatch.dto.IncidentResponse> findActiveCasesByUser(@Param("user") User user);
    
    /**
     * Optimized query for incident history page
     * Uses query cache with name "userIncidentHistory"
     */
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "userIncidentHistory")
    })
    @Query("SELECT new com.teamhyungie.WildWatch.dto.IncidentResponse(" +
           "i.id, i.trackingNumber, i.incidentType, i.location, i.status, " +
           "i.description, i.submittedAt, i.dateOfIncident, i.timeOfIncident, " +
           "i.priorityLevel, i.resolutionNotes) " +
           "FROM Incident i " +
           "WHERE i.submittedBy = :user " +
           "ORDER BY i.submittedAt DESC")
    List<com.teamhyungie.WildWatch.dto.IncidentResponse> findUserIncidentHistory(@Param("user") User user);
    
    /**
     * Count resolved incidents by office admin
     * @param officeAdmin The office admin who resolved the incidents
     * @return Total count of resolved incidents
     */
    @Query("SELECT COUNT(i) FROM Incident i WHERE i.resolvedBy = :officeAdmin AND (LOWER(i.status) = 'resolved' OR LOWER(i.status) = 'closed')")
    Integer countResolvedIncidentsByOfficeAdmin(@Param("officeAdmin") User officeAdmin);
    
    /**
     * Count incidents with high ratings by office admin
     * @param officeAdmin The office admin who handled the incidents
     * @param minRating The minimum rating threshold
     * @return Total count of incidents with ratings >= minRating
     */
    @Query("SELECT COUNT(i) FROM Incident i WHERE i.resolvedBy = :officeAdmin AND i.rating >= :minRating")
    Integer countHighRatedIncidentsByOfficeAdmin(@Param("officeAdmin") User officeAdmin, @Param("minRating") Integer minRating);
} 