package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.PriorityLevel;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class IncidentUpdateRequest {
    private String status;
    private String updateMessage;
    private String updatedBy;
    private boolean isVisibleToReporter = true;
    private PriorityLevel priorityLevel;
    private boolean isVerified;
    private String resolutionNotes;
    private Boolean preferAnonymous;
    private Boolean isPrivate;
    // Optional – allows office admins to set or update the initial estimated resolution date
    private LocalDateTime estimatedResolutionDate;
    // Optional – allows office admins to tag report as incident (true) or concern (false)
    private Boolean isIncident;
} 