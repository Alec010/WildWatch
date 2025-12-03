package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.OfficeAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OfficeAdminRepository extends JpaRepository<OfficeAdmin, Long> {
    Optional<OfficeAdmin> findByOfficeCode(String officeCode);
    Optional<OfficeAdmin> findByUser_Email(String email);
    boolean existsByOfficeCode(String officeCode);
    
    /**
     * Get all gold-ranked office admins ordered by points
     * @return List of office admins with GOLD rank
     */
    @Query("SELECT o FROM OfficeAdmin o WHERE o.userRank = com.teamhyungie.WildWatch.model.UserRank.GOLD ORDER BY o.points DESC")
    List<OfficeAdmin> findGoldRankedOfficeAdmins();
    
    /**
     * Count office admins ahead of given office admin in Gold rank
     * @param officePoints The office admin's points
     * @return Count of office admins with more points in Gold rank
     */
    @Query("SELECT COUNT(o) FROM OfficeAdmin o WHERE o.userRank = com.teamhyungie.WildWatch.model.UserRank.GOLD AND o.points > :officePoints")
    int countOfficeAdminsAheadInGold(@Param("officePoints") Float officePoints);
    
    /**
     * Get top 10 gold-ranked office admins with their stats (Gold Elite)
     * @return List of object arrays with office admin data
     */
    @Query("SELECT o.id, o.officeCode, o.points, " +
           "COALESCE(AVG(r.reporterHonesty + r.reporterCredibility + r.reporterResponsiveness + r.reporterHelpfulness) / 4.0, 0) as avgRating, " +
           "COUNT(i.id) as totalIncidents " +
           "FROM OfficeAdmin o " +
           "LEFT JOIN Incident i ON i.assignedOffice = o.officeCode " +
           "LEFT JOIN IncidentRating r ON r.incident.id = i.id " +
           "WHERE o.userRank = com.teamhyungie.WildWatch.model.UserRank.GOLD " +
           "GROUP BY o.id, o.officeCode, o.points " +
           "ORDER BY o.points DESC")
    List<Object[]> getGoldEliteOfficeAdmins();
} 