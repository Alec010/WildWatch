package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.ActivityLog;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ActivityLogService {
    private final ActivityLogRepository activityLogRepository;

    public void logActivity(String activityType, String description, Incident incident, User user) {
        ActivityLog log = new ActivityLog();
        log.setActivityType(activityType);
        log.setDescription(description);
        log.setIncident(incident);
        log.setUser(user);
        activityLogRepository.save(log);
    }

    public Page<ActivityLog> getUserActivityLogs(User user, Pageable pageable) {
        return activityLogRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }
} 