package com.teamhyungie.WildWatch.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private String id;
    private String activityType;
    private String description;
    private LocalDateTime createdAt;
    private Boolean isRead;
    private Long userId; // Add userId for client-side validation
    private IncidentDTO incident;

    @Data
    public static class IncidentDTO {
        private String id;
        private String trackingNumber;
    }
} 