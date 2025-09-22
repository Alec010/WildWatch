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
} 