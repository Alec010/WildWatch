package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.Badge;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    
    List<UserBadge> findByUser(User user);
    
    Optional<UserBadge> findByUserAndBadge(User user, Badge badge);
    
    @Query("SELECT SUM(b.pointReward) FROM UserBadge ub JOIN ub.badge b WHERE ub.user = :user AND ub.currentLevel > 0")
    Integer getTotalBadgePoints(User user);
    
    @Query("SELECT COUNT(ub) FROM UserBadge ub WHERE ub.user = :user AND ub.currentLevel > 0")
    Integer getEarnedBadgesCount(User user);
}





