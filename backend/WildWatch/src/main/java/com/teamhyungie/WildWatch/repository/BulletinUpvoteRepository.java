package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.BulletinUpvote;
import com.teamhyungie.WildWatch.model.OfficeBulletin;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BulletinUpvoteRepository extends JpaRepository<BulletinUpvote, String> {
    
    Optional<BulletinUpvote> findByBulletinAndUser(OfficeBulletin bulletin, User user);
    
    boolean existsByBulletinAndUser(OfficeBulletin bulletin, User user);
    
    List<BulletinUpvote> findByBulletinOrderByCreatedAtDesc(OfficeBulletin bulletin);
    
    List<BulletinUpvote> findByBulletinAndCreatedAtAfterOrderByCreatedAtDesc(
        OfficeBulletin bulletin, 
        LocalDateTime since
    );
    
    @Query("SELECT COUNT(bu) FROM BulletinUpvote bu WHERE bu.bulletin = :bulletin")
    int countByBulletin(@Param("bulletin") OfficeBulletin bulletin);
    
    @Query("SELECT bu.user.id FROM BulletinUpvote bu WHERE bu.bulletin = :bulletin ORDER BY bu.createdAt DESC")
    List<String> findUserIdsByBulletinOrderByCreatedAtDesc(@Param("bulletin") OfficeBulletin bulletin);
    
    @Query("SELECT bu.user.id FROM BulletinUpvote bu WHERE bu.bulletin = :bulletin ORDER BY bu.createdAt DESC LIMIT :limit")
    List<String> findRecentUserIdsByBulletinOrderByCreatedAtDesc(
        @Param("bulletin") OfficeBulletin bulletin, 
        @Param("limit") int limit
    );
    
    @Query("SELECT bu.user FROM BulletinUpvote bu WHERE bu.bulletin = :bulletin ORDER BY bu.createdAt DESC LIMIT 1")
    Optional<User> findLatestUpvoterByBulletin(@Param("bulletin") OfficeBulletin bulletin);
    
    void deleteByBulletinAndUser(OfficeBulletin bulletin, User user);
}
