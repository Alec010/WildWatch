package com.teamhyungie.WildWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidentRatingResponse {
    private String incidentId;
    private Integer reporterRating;
    private String reporterFeedback;
    private Integer officeRating;
    private String officeFeedback;
} 