package com.teamhyungie.WildWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for user's overall badge summary
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBadgeSummaryDTO {
    private Integer totalBadgesEarned;
    private Integer totalBadgesAvailable;
    private Integer totalPointsEarned;
    private List<BadgeProgressDTO> badges;
}





