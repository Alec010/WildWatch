package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.Badge;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for user's badge progress
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BadgeProgressDTO {
    private Long badgeId;
    private String name;
    private String description;
    private String iconUrl;
    private Integer pointReward;
    private Badge.BadgeType badgeType;
    private Integer currentLevel;
    private Integer currentProgress;
    private Integer nextLevelRequirement;
    private Float progressPercentage;
    private List<BadgeLevelDTO> levels;
    private Boolean isCompleted; // True when all 3 stars are earned
    private Boolean pointsAwarded; // True when points have been awarded for completion
}
