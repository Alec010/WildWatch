package com.teamhyungie.WildWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for badge level information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BadgeLevelDTO {
    private Integer level;
    private String description;
    private Integer requirement;
    private Boolean achieved;
    private LocalDateTime awardedDate;
}





