package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.ActivityLog;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ActivityLogResponse {
    private String id;
    private String activityType;
    private String description;
    private LocalDateTime createdAt;
    private Boolean isRead;
    private String userId; // User ID to filter notifications
    private IncidentInfo incident;

    @Data
    public static class IncidentInfo {
        private String id;
        private String trackingNumber;
    }

    public static ActivityLogResponse fromActivityLog(ActivityLog activityLog) {
        ActivityLogResponse response = new ActivityLogResponse();
        response.setId(activityLog.getId());
        response.setActivityType(activityLog.getActivityType());
        response.setDescription(activityLog.getDescription());
        response.setCreatedAt(activityLog.getCreatedAt());
        response.setIsRead(activityLog.getIsRead());
        if (activityLog.getUser() != null) {
            response.setUserId(String.valueOf(activityLog.getUser().getId()));
        }

        if (activityLog.getIncident() != null) {
            IncidentInfo incidentInfo = new IncidentInfo();
            incidentInfo.setId(activityLog.getIncident().getId());
            incidentInfo.setTrackingNumber(activityLog.getIncident().getTrackingNumber());
            response.setIncident(incidentInfo);
        }

        return response;
    }
} 