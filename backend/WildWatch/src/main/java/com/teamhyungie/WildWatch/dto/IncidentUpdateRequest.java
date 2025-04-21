package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.PriorityLevel;
import lombok.Data;

@Data
public class IncidentUpdateRequest {
    private String administrativeNotes;
    private boolean verified;
    private String verificationNotes;
    private String status;
    private PriorityLevel priorityLevel;
} 