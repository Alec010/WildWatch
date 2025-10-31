package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.Building;
import com.teamhyungie.WildWatch.model.PriorityLevel;
import com.teamhyungie.WildWatch.model.IncidentGeneralTag;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
public class IncidentResponse {

    private String id;
    private String trackingNumber;
    private String incidentType;
    private LocalDate dateOfIncident;
    private LocalTime timeOfIncident;
    private String location;
    private String formattedAddress;
    private Double latitude;
    private Double longitude;
    private Building building;
    private String buildingName;
    private String buildingCode;
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
    private List<String> tags; // Top 5 weighted tags for display

    // New fields for frontend display
    private String officeAdminName;
    private LocalDateTime finishedDate;
    private Boolean verified;
    private String transferredFrom;
    private String lastTransferredTo;
    private String lastTransferNotes;
    private Integer upvoteCount;
    private String resolutionNotes;
    private LocalDateTime estimatedResolutionDate;
    private String resolutionExtendedBy;
    private LocalDateTime resolutionExtendedAt;
    private Boolean preferAnonymous;
    private Boolean isPrivate;

    /**
     * Constructor for optimized dashboard queries This constructor is used by
     * the repository to create lightweight DTO objects directly from the query
     * without loading the entire entity graph
     */
    public IncidentResponse(String id, String trackingNumber, String incidentType, String location,
            String status, String description, LocalDateTime submittedAt,
            Integer upvoteCount, String firstName, String lastName, String email) {
        this.id = id;
        this.trackingNumber = trackingNumber;
        this.incidentType = incidentType;
        this.location = location;
        this.status = status;
        this.description = description;
        this.submittedAt = submittedAt;
        this.upvoteCount = upvoteCount;
        this.submittedByFullName = firstName + " " + lastName;
        this.submittedByEmail = email;
        this.submittedBy = email;
    }

    /**
     * Constructor for office admin incident management queries Includes
     * transfer information and date/time details
     */
    public IncidentResponse(String id, String trackingNumber, String incidentType, String location,
            String status, String description, LocalDateTime submittedAt,
            LocalDate dateOfIncident, LocalTime timeOfIncident,
            String firstName, String lastName, String email,
            String transferredFrom, String lastTransferredTo, String lastTransferNotes,
            PriorityLevel priorityLevel) {
        this.id = id;
        this.trackingNumber = trackingNumber;
        this.incidentType = incidentType;
        this.location = location;
        this.status = status;
        this.description = description;
        this.submittedAt = submittedAt;
        this.dateOfIncident = dateOfIncident;
        this.timeOfIncident = timeOfIncident;
        this.submittedByFullName = firstName + " " + lastName;
        this.submittedByEmail = email;
        this.submittedBy = email;
        this.transferredFrom = transferredFrom;
        this.lastTransferredTo = lastTransferredTo;
        this.lastTransferNotes = lastTransferNotes;
        this.priorityLevel = priorityLevel;
    }

    /**
     * Constructor for verified cases tracker
     */
    public IncidentResponse(String id, String trackingNumber, String incidentType, String location,
            String status, String description, LocalDateTime submittedAt,
            LocalDate dateOfIncident, LocalTime timeOfIncident,
            String firstName, String lastName, String email,
            Boolean verified, PriorityLevel priorityLevel) {
        this.id = id;
        this.trackingNumber = trackingNumber;
        this.incidentType = incidentType;
        this.location = location;
        this.status = status;
        this.description = description;
        this.submittedAt = submittedAt;
        this.dateOfIncident = dateOfIncident;
        this.timeOfIncident = timeOfIncident;
        this.submittedByFullName = firstName + " " + lastName;
        this.submittedByEmail = email;
        this.submittedBy = email;
        this.verified = verified;
        this.priorityLevel = priorityLevel;
    }

    /**
     * Constructor for case tracking page - active cases
     */
    public IncidentResponse(String id, String trackingNumber, String incidentType, String location,
            String status, String description, LocalDateTime submittedAt,
            LocalDate dateOfIncident, LocalTime timeOfIncident,
            PriorityLevel priorityLevel) {
        this.id = id;
        this.trackingNumber = trackingNumber;
        this.incidentType = incidentType;
        this.location = location;
        this.status = status;
        this.description = description;
        this.submittedAt = submittedAt;
        this.dateOfIncident = dateOfIncident;
        this.timeOfIncident = timeOfIncident;
        this.priorityLevel = priorityLevel;
    }

    /**
     * Constructor for incident history page
     */
    public IncidentResponse(String id, String trackingNumber, String incidentType, String location,
            String status, String description, LocalDateTime submittedAt,
            LocalDate dateOfIncident, LocalTime timeOfIncident,
            PriorityLevel priorityLevel, String resolutionNotes) {
        this.id = id;
        this.trackingNumber = trackingNumber;
        this.incidentType = incidentType;
        this.location = location;
        this.status = status;
        this.description = description;
        this.submittedAt = submittedAt;
        this.dateOfIncident = dateOfIncident;
        this.timeOfIncident = timeOfIncident;
        this.priorityLevel = priorityLevel;
        this.resolutionNotes = resolutionNotes;
        // Calculate finishedDate based on submittedAt for resolved/dismissed cases
        if (status != null && (status.equalsIgnoreCase("resolved") || status.equalsIgnoreCase("dismissed"))) {
            this.finishedDate = submittedAt;
        }
    }

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
        private Long userId;
        private String name;
        private String contactInformation;
        private String additionalNotes;
        // Flag to indicate if this witness is a registered user
        private boolean registeredUser;
    }

    public static IncidentResponse fromIncident(Incident incident) {
        IncidentResponse response = new IncidentResponse();
        response.setId(incident.getId());
        response.setTrackingNumber(incident.getTrackingNumber());
        response.setIncidentType(incident.getIncidentType());
        response.setDateOfIncident(incident.getDateOfIncident());
        response.setTimeOfIncident(incident.getTimeOfIncident());
        response.setLocation(incident.getLocation());
        response.setFormattedAddress(incident.getFormattedAddress());
        response.setLatitude(incident.getLatitude());
        response.setLongitude(incident.getLongitude());
        response.setBuilding(incident.getBuilding());
        response.setBuildingName(incident.getBuilding() != null ? incident.getBuilding().getFullName() : null);
        response.setBuildingCode(incident.getBuilding() != null ? incident.getBuilding().getCode() : null);
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
        response.setResolutionNotes(incident.getResolutionNotes());
        response.setVerified(incident.getVerified());
        response.setTransferredFrom(incident.getTransferredFrom());
        response.setLastTransferredTo(incident.getLastTransferredTo());
        response.setLastTransferNotes(incident.getLastTransferNotes());
        response.setUpvoteCount(incident.getUpvoteCount());
        response.setEstimatedResolutionDate(incident.getEstimatedResolutionDate());
        response.setResolutionExtendedBy(incident.getResolutionExtendedBy() != null
                ? incident.getResolutionExtendedBy().getFirstName() + " " + incident.getResolutionExtendedBy().getLastName() : null);
        response.setResolutionExtendedAt(incident.getResolutionExtendedAt());
        response.setPreferAnonymous(incident.getPreferAnonymous());
        response.setIsPrivate(incident.getIsPrivate());

        // Map tags - convert generalTags to tag names
        // Note: For display, we'll use the transient tags field if available (contains top 5),
        // otherwise convert all generalTags to names (all 20 tags are stored but we typically only need top 5)
        if (incident.getTags() != null && !incident.getTags().isEmpty()) {
            // Use transient tags field if set (usually contains top 5 selected tags)
            response.setTags(incident.getTags());
        } else if (incident.getGeneralTags() != null && !incident.getGeneralTags().isEmpty()) {
            // Convert generalTags to tag names
            response.setTags(
                    incident.getGeneralTags().stream()
                            .map(IncidentGeneralTag::getName)
                            .collect(Collectors.toList())
            );
        }

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

                        // Check if this witness is a registered user
                        if (w.getUser() != null) {
                            dto.setUserId(w.getUser().getId());
                            dto.setName(w.getUser().getFullName());
                            dto.setContactInformation(w.getUser().getEmail());
                            dto.setRegisteredUser(true);
                        } else {
                            dto.setName(w.getName());
                            dto.setContactInformation(w.getContactInformation());
                            dto.setRegisteredUser(false);
                        }

                        dto.setAdditionalNotes(w.getAdditionalNotes());
                        return dto;
                    }).collect(Collectors.toList())
            );
        }

        return response;
    }
}
