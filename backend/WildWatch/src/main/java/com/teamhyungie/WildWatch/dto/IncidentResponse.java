package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.PriorityLevel;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class IncidentResponse {
    private String id;
    private String trackingNumber;
    private String incidentType;
    private LocalDate dateOfIncident;
    private LocalTime timeOfIncident;
    private String location;
    private String description;
    private Office assignedOffice;
    private PriorityLevel priorityLevel;
    private String status;
    private String submittedBy;
    private String submittedByFullName;
    private String submittedByIdNumber;
    private String submittedByEmail;
    private String submittedByPhone;
    private LocalDateTime submittedAt;
    private List<EvidenceDTO> evidence;
    private List<WitnessDTO> witnesses;

    @Data
    public static class EvidenceDTO {
        private String id;
        private String fileUrl;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private LocalDateTime uploadedAt;
    }

    @Data
    public static class WitnessDTO {
        private String id;
        private String name;
        private String contactInformation;
        private String additionalNotes;
    }

    public static IncidentResponse fromIncident(Incident incident) {
        IncidentResponse response = new IncidentResponse();
        response.setId(incident.getId());
        response.setTrackingNumber(incident.getTrackingNumber());
        response.setIncidentType(incident.getIncidentType());
        response.setDateOfIncident(incident.getDateOfIncident());
        response.setTimeOfIncident(incident.getTimeOfIncident());
        response.setLocation(incident.getLocation());
        response.setDescription(incident.getDescription());
        response.setAssignedOffice(incident.getAssignedOffice());
        response.setPriorityLevel(incident.getPriorityLevel());
        response.setStatus(incident.getStatus());
        response.setSubmittedBy(incident.getSubmittedBy().getEmail());
        response.setSubmittedByFullName(incident.getSubmittedBy().getFirstName() + " " + incident.getSubmittedBy().getLastName());
        response.setSubmittedByIdNumber(incident.getSubmittedBy().getSchoolIdNumber());
        response.setSubmittedByEmail(incident.getSubmittedBy().getEmail());
        response.setSubmittedByPhone(incident.getSubmittedBy().getContactNumber());
        response.setSubmittedAt(incident.getSubmittedAt());
        
        return response;
    }
} 