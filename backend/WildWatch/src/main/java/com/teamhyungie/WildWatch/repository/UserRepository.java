package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsBySchoolIdNumber(String schoolIdNumber);
    Optional<User> findByVerificationToken(String token);
    Optional<User> findByResetToken(String resetToken);
    
    /**
     * Search for users by name or email, used for @mention functionality
     * @param query The search term to match against name or email
     * @param pageable Pagination parameters
     * @return Page of matching users
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<User> searchUsers(@Param("query") String query, Pageable pageable);
    
    /**
     * Find users by their IDs
     * @param ids List of user IDs
     * @return List of matching users
     */
    List<User> findByIdIn(List<Long> ids);
    
    /**
     * Get all gold-ranked users ordered by points (for Gold Elite leaderboard)
     * @return List of users with GOLD rank
     */
    @Query("SELECT u FROM User u WHERE u.userRank = com.teamhyungie.WildWatch.model.UserRank.GOLD ORDER BY u.points DESC")
    List<User> findGoldRankedUsers();
    
    /**
     * Count users ahead of given user in Gold rank (for ranking calculation)
     * @param userPoints The user's points
     * @return Count of users with more points in Gold rank
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.userRank = com.teamhyungie.WildWatch.model.UserRank.GOLD AND u.points > :userPoints")
    int countUsersAheadInGold(@Param("userPoints") Float userPoints);
    
    /**
     * Get top 10 gold-ranked users with their stats (Gold Elite)
     * @return List of object arrays with user data
     */
    @Query("SELECT u.id, u.firstName, u.lastName, u.points, " +
           "COALESCE(AVG(r.officeHonesty + r.officeCredibility + r.officeResponsiveness + r.officeHelpfulness) / 4.0, 0) as avgRating, " +
           "COUNT(i.id) as totalIncidents " +
           "FROM User u " +
           "LEFT JOIN Incident i ON i.submittedBy.id = u.id " +
           "LEFT JOIN IncidentRating r ON r.incident.id = i.id " +
           "WHERE u.userRank = com.teamhyungie.WildWatch.model.UserRank.GOLD " +
           "GROUP BY u.id, u.firstName, u.lastName, u.points " +
           "ORDER BY u.points DESC")
    List<Object[]> getGoldEliteUsers();
} 