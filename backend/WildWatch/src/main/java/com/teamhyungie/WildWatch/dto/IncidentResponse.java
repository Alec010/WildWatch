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

    // New fields for frontend display
    private String officeAdminName;
    private LocalDateTime finishedDate;
    private Boolean verified;
    private String transferredFrom;
    private String lastTransferredTo;
    private String lastTransferNotes;
    private Integer upvoteCount;

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
        response.setVerified(incident.getVerified());
        response.setTransferredFrom(incident.getTransferredFrom());
        response.setLastTransferredTo(incident.getLastTransferredTo());
        response.setLastTransferNotes(incident.getLastTransferNotes());
        response.setUpvoteCount(incident.getUpvoteCount());

        // Map evidence
        if (incident.getEvidence() != null) {
            response.setEvidence(
                incident.getEvidence().stream().map(e -> {
                    EvidenceDTO dto = new EvidenceDTO();
                    dto.setId(e.getId());
                    dto.setFileUrl(e.getFileUrl());
                    dto.setFileName(e.getFileName());
                    dto.setFileType(e.getFileType());
                    dto.setFileSize(e.getFileSize());
                    dto.setUploadedAt(e.getUploadedAt());
                    return dto;
                }).collect(Collectors.toList())
            );
        }

        // Map witnesses
        if (incident.getWitnesses() != null) {
            response.setWitnesses(
                incident.getWitnesses().stream().map(w -> {
                    WitnessDTO dto = new WitnessDTO();
                    dto.setId(w.getId());
                    dto.setName(w.getName());
                    dto.setContactInformation(w.getContactInformation());
                    dto.setAdditionalNotes(w.getAdditionalNotes());
                    return dto;
                }).collect(Collectors.toList())
            );
        }

        return response;
    }
} 