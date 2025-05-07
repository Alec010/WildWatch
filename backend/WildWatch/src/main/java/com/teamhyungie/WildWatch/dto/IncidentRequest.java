package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.Office;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class IncidentRequest {
    @NotBlank(message = "Incident type is required")
    private String incidentType;

    @NotNull(message = "Date of incident is required")
    private LocalDate dateOfIncident;

    @NotNull(message = "Time of incident is required")
    private LocalTime timeOfIncident;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Assigned office is required")
    private Office assignedOffice;

    private List<WitnessDTO> witnesses;

    private Boolean preferAnonymous;

    @Data
    public static class WitnessDTO {
        private String name;
        private String contactInformation;
        private String additionalNotes;
    }
} 