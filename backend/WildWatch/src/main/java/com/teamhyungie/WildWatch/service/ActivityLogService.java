package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.ActivityLog;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.repository.ActivityLogRepository;
import com.teamhyungie.WildWatch.dto.NotificationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {
    private final ActivityLogRepository activityLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void logActivity(String activityType, String description, Incident incident, User user) {
        ActivityLog log = new ActivityLog();
        log.setActivityType(activityType);
        log.setDescription(description);
        log.setIncident(incident);
        log.setUser(user);
        activityLogRepository.save(log);
        // Send notification to WebSocket topic
        messagingTemplate.convertAndSend("/topic/notifications", toNotificationDTO(log));
    }

    private NotificationDTO toNotificationDTO(ActivityLog log) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(log.getId());
        dto.setActivityType(log.getActivityType());
        dto.setDescription(log.getDescription());
        dto.setCreatedAt(log.getCreatedAt());
        dto.setIsRead(log.getIsRead());
        if (log.getUser() != null) {
            dto.setUserId(log.getUser().getId());
        }
        if (log.getIncident() != null) {
            NotificationDTO.IncidentDTO incidentDTO = new NotificationDTO.IncidentDTO();
            incidentDTO.setId(log.getIncident().getId());
            incidentDTO.setTrackingNumber(log.getIncident().getTrackingNumber());
            dto.setIncident(incidentDTO);
        }
        return dto;
    }

    public Page<ActivityLog> getUserActivityLogs(User user, Pageable pageable) {
        return activityLogRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    @Transactional
    public void markAsRead(String id, User user) {
        ActivityLog log = activityLogRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Activity log not found"));
        
        if (!log.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to mark this notification as read");
        }
        
        log.setIsRead(true);
        activityLogRepository.save(log);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<ActivityLog> logs = activityLogRepository.findByUserAndIsReadFalse(user);
        logs.forEach(log -> log.setIsRead(true));
        activityLogRepository.saveAll(logs);
    }
} 