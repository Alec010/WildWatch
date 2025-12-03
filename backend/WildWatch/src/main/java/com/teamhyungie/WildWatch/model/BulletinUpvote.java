package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import static com.teamhyungie.WildWatch.config.TimezoneConfig.APP_TIMEZONE;

/**
 * Entity to track upvotes on office bulletins
 */
@Entity
@Table(name = "bulletin_upvotes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"bulletin_id", "user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulletinUpvote {
    @Id
    @GeneratedValue(generator = "uuid")
    @GenericGenerator(name = "uuid", strategy = "uuid2")
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id", nullable = false)
    private OfficeBulletin bulletin;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now(APP_TIMEZONE);
    
    // Constructor with required fields
    public BulletinUpvote(OfficeBulletin bulletin, User user) {
        this.bulletin = bulletin;
        this.user = user;
        this.createdAt = LocalDateTime.now(APP_TIMEZONE);
    }
}
