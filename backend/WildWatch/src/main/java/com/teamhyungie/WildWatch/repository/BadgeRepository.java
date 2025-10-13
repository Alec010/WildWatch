package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {
    
    Optional<Badge> findByBadgeType(Badge.BadgeType badgeType);
    
    List<Badge> findAllByOrderByBadgeTypeAsc();
}




