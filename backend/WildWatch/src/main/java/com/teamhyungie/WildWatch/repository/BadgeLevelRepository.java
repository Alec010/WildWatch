package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.Badge;
import com.teamhyungie.WildWatch.model.BadgeLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeLevelRepository extends JpaRepository<BadgeLevel, Long> {
    
    List<BadgeLevel> findByBadgeOrderByLevelAsc(Badge badge);
    
    Optional<BadgeLevel> findByBadgeAndLevel(Badge badge, Integer level);
}




