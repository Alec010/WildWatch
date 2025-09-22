package com.teamhyungie.WildWatch.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.Building;
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

    private String formattedAddress;

    private Double latitude;

    private Double longitude;

    @JsonDeserialize(using = BuildingDeserializer.class)
    private Building building;

    @NotBlank(message = "Description is required")
    private String description;

    @JsonDeserialize(using = OfficeDeserializer.class)
    private Office assignedOffice;

    private List<WitnessDTO> witnesses;

    private Boolean preferAnonymous;

    private List<String> tags;

    @Data
    public static class WitnessDTO {
        /**
         * ID of a registered user (for @mention functionality)
         * When this is set, name and contactInformation will be derived from the user
         */
        private Long userId;
        
        /**
         * Manual name entry (used when userId is null)
         * This field will be ignored if userId is provided
         */
        private String name;
        
        /**
         * Manual contact information (used when userId is null)
         * This field will be ignored if userId is provided
         */
        private String contactInformation;
        
        /**
         * Additional notes about the witness's account
         * This applies regardless of whether the witness is a registered user
         */
        private String additionalNotes;
    }
} 