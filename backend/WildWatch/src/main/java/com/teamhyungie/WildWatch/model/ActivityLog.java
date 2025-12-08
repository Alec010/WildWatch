package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import static com.teamhyungie.WildWatch.config.TimezoneConfig.APP_TIMEZONE;

@Entity
@Table(name = "activity_logs")
@Data
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    private Incident incident;

    @Column(name = "activity_type", nullable = false)
    private String activityType; // e.g., "STATUS_CHANGE", "NEW_REPORT", "CASE_RESOLVED"

    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now(APP_TIMEZONE);

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "is_read")
    private Boolean isRead = false;

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
} 