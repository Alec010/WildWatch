package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "incident_upvotes")
@Data
public class IncidentUpvote {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
} 