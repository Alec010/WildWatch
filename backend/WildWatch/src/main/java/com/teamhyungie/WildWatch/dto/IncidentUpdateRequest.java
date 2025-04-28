package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.PriorityLevel;
import lombok.Data;

@Data
public class IncidentUpdateRequest {
    private String status;
    private String updateMessage;
    private String updatedBy;
    private boolean isVisibleToReporter = true;
    private PriorityLevel priorityLevel;
    private boolean isVerified;
} 