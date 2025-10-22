package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity to track follow-up requests from users
 * Used to enforce the once-per-day limit
 */
@Entity
@Table(name = "follow_up_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    private Incident incident;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Constructor with required fields
    public FollowUpRecord(Incident incident, User user) {
        this.incident = incident;
        this.user = user;
        this.createdAt = LocalDateTime.now();
    }
}
