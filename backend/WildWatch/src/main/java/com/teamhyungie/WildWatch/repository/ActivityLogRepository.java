package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.ActivityLog;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {
    Page<ActivityLog> findByUser(User user, Pageable pageable);
    Page<ActivityLog> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
} 