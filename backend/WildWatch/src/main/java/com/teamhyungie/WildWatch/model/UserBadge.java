package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a user's progress towards earning badge levels
 */
@Entity
@Table(name = "user_badges", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "badge_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @Column(name = "current_level", nullable = false)
    private Integer currentLevel;

    @Column(name = "current_progress", nullable = false)
    private Integer currentProgress;

    @Column(name = "level1_awarded_date")
    private LocalDateTime level1AwardedDate;

    @Column(name = "level2_awarded_date")
    private LocalDateTime level2AwardedDate;

    @Column(name = "level3_awarded_date")
    private LocalDateTime level3AwardedDate;

    @Column(name = "is_notified", nullable = false)
    private Boolean isNotified;

    @Column(name = "points_awarded", nullable = false)
    private Boolean pointsAwarded;

    /**
     * Get the awarded date for a specific level
     */
    public LocalDateTime getAwardedDateForLevel(int level) {
        switch (level) {
            case 1:
                return level1AwardedDate;
            case 2:
                return level2AwardedDate;
            case 3:
                return level3AwardedDate;
            default:
                return null;
        }
    }

    /**
     * Set the awarded date for a specific level
     */
    public void setAwardedDateForLevel(int level, LocalDateTime date) {
        switch (level) {
            case 1:
                this.level1AwardedDate = date;
                break;
            case 2:
                this.level2AwardedDate = date;
                break;
            case 3:
                this.level3AwardedDate = date;
                break;
        }
    }
}
