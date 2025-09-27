package com.teamhyungie.WildWatch.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResolvedIncidentResponse {
    private String id;
    private String trackingNumber;
    private String description;
    private String status;
    private LocalDateTime submittedAt;
    private String location;
    private String incidentType;
}


