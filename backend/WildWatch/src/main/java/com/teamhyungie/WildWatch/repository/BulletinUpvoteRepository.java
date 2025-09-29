package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.BulletinUpvote;
import com.teamhyungie.WildWatch.model.OfficeBulletin;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface BulletinUpvoteRepository extends JpaRepository<BulletinUpvote, String> {
    Optional<BulletinUpvote> findByBulletinAndUser(OfficeBulletin bulletin, User user);
    boolean existsByBulletinAndUser(OfficeBulletin bulletin, User user);
    long countByBulletin(OfficeBulletin bulletin);

    @Query("select bu.bulletin.id from BulletinUpvote bu where bu.user.id = :userId")
    List<String> findUpvotedBulletinIdsByUserId(@Param("userId") Long userId);
}


