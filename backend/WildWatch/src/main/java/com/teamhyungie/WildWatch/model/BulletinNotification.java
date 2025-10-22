package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity to store aggregated bulletin upvote notifications
 */
@Entity
@Table(name = "bulletin_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulletinNotification {
    @Id
    @GeneratedValue(generator = "uuid")
    @GenericGenerator(name = "uuid", strategy = "uuid2")
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id", nullable = false)
    private OfficeBulletin bulletin;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;
    
    @Column(name = "notification_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private NotificationType notificationType;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    @Column(name = "upvote_count", nullable = false)
    private Integer upvoteCount = 0;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "latest_upvoter_id")
    private User latestUpvoter;
    
    @ElementCollection
    @CollectionTable(name = "bulletin_notification_upvoters", 
                    joinColumns = @JoinColumn(name = "notification_id"))
    @Column(name = "upvoter_id")
    private List<String> recentUpvoterIds = new ArrayList<>();
    
    public enum NotificationType {
        UPVOTE,
        COMMENT,
        MENTION
    }
}
