package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing a badge that can be earned by users
 */
@Entity
@Table(name = "badges")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "point_reward")
    private Integer pointReward;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_type", nullable = false)
    private BadgeType badgeType;

    @Column(name = "max_level", nullable = false)
    private Integer maxLevel;

    /**
     * Enum for different types of badges
     */
    public enum BadgeType {
        // Regular user badges
        FIRST_RESPONDER,
        COMMUNITY_HELPER,
        CAMPUS_LEGEND,
        // Office admin badges
        FIRST_RESPONSE,
        RATING_CHAMPION,
        OFFICE_LEGEND
    }
}




