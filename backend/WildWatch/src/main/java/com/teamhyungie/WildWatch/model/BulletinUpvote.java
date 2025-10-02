package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "bulletin_upvotes",
    uniqueConstraints = {
        @UniqueConstraint(name = "ux_bulletin_user", columnNames = {"bulletin_id", "user_id"})
    }
)
@Data
public class BulletinUpvote {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id", nullable = false)
    private OfficeBulletin bulletin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}


