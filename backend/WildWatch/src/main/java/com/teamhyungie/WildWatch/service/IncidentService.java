package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.IncidentRequest;
import com.teamhyungie.WildWatch.dto.IncidentResponse;
import com.teamhyungie.WildWatch.dto.IncidentUpdateRequest;
import com.teamhyungie.WildWatch.dto.IncidentUpdateResponse;
import com.teamhyungie.WildWatch.model.Evidence;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.Witness;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.model.IncidentUpdate;
import com.teamhyungie.WildWatch.repository.EvidenceRepository;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import com.teamhyungie.WildWatch.repository.WitnessRepository;
import com.teamhyungie.WildWatch.repository.IncidentUpdateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class IncidentService {
    private final IncidentRepository incidentRepository;
    private final WitnessRepository witnessRepository;
    private final EvidenceRepository evidenceRepository;
    private final UserService userService;
    private final SupabaseStorageService storageService;
    private final OfficeAdminService officeAdminService;
    private final ActivityLogService activityLogService;
    private final IncidentUpdateRepository incidentUpdateRepository;

    @Transactional
    public IncidentResponse createIncident(IncidentRequest request, String userEmail, List<MultipartFile> files) {
        User user = userService.getUserByEmail(userEmail);
        
        // Create and save the incident first
        final Incident savedIncident = createAndSaveIncident(request, user);

        // Handle witnesses if provided
        if (request.getWitnesses() != null && !request.getWitnesses().isEmpty()) {
            List<Witness> witnesses = request.getWitnesses().stream()
                .map(witnessDTO -> createWitness(witnessDTO, savedIncident))
                .collect(Collectors.toList());
            witnessRepository.saveAll(witnesses);
        }

        // Handle file uploads if provided
        if (files != null && !files.isEmpty()) {
            List<Evidence> evidenceList = files.stream()
                .map(file -> createEvidence(file, savedIncident))
                .collect(Collectors.toList());
            evidenceRepository.saveAll(evidenceList);
        }

        // Log activity
        activityLogService.logActivity(
            "NEW_REPORT",
            "You submitted a new incident report for " + request.getIncidentType(),
            savedIncident,
            user
        );

        return IncidentResponse.fromIncident(savedIncident);
    }

    private Incident createAndSaveIncident(IncidentRequest request, User user) {
        Incident incident = new Incident();
        incident.setIncidentType(request.getIncidentType());
        incident.setDateOfIncident(request.getDateOfIncident());
        incident.setTimeOfIncident(request.getTimeOfIncident());
        incident.setLocation(request.getLocation());
        incident.setDescription(request.getDescription());
        incident.setAssignedOffice(request.getAssignedOffice());
        incident.setSubmittedBy(user);
        
        return incidentRepository.save(incident);
    }

    private Witness createWitness(IncidentRequest.WitnessDTO witnessDTO, Incident incident) {
        Witness witness = new Witness();
        witness.setIncident(incident);
        witness.setName(witnessDTO.getName());
        witness.setContactInformation(witnessDTO.getContactInformation());
        witness.setAdditionalNotes(witnessDTO.getAdditionalNotes());
        return witness;
    }

    private Evidence createEvidence(MultipartFile file, Incident incident) {
        String fileUrl = storageService.storeFile(file);
        
        Evidence evidence = new Evidence();
        evidence.setIncident(incident);
        evidence.setFileName(file.getOriginalFilename());
        evidence.setFileType(file.getContentType());
        evidence.setFileSize(file.getSize());
        evidence.setFileUrl(fileUrl);
        
        return evidence;
    }

    private IncidentResponse mapToIncidentResponseWithExtras(Incident incident) {
        IncidentResponse response = IncidentResponse.fromIncident(incident);
        // Set office admin name
        String officeAdminName = null;
        if (incident.getAssignedOffice() != null) {
            officeAdminService.findByOfficeCode(incident.getAssignedOffice().name())
                .ifPresent(admin -> {
                    User adminUser = admin.getUser();
                    response.setOfficeAdminName(adminUser.getFirstName() + " " + adminUser.getLastName());
                });
        }
        // Set finished date (latest update with status Resolved or Closed)
        IncidentUpdate finishedUpdate = incidentUpdateRepository.findFirstByIncidentAndStatusInOrderByUpdatedAtDesc(
            incident, Arrays.asList("Resolved", "resolved", "Closed", "closed")
        );
        if (finishedUpdate != null) {
            response.setFinishedDate(finishedUpdate.getUpdatedAt());
        }
        return response;
    }

    public List<IncidentResponse> getUserIncidents(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        return incidentRepository.findBySubmittedByOrderBySubmittedAtDesc(user)
            .stream()
            .map(this::mapToIncidentResponseWithExtras)
            .collect(Collectors.toList());
    }

    public IncidentResponse getIncidentByTrackingNumber(String trackingNumber) {
        Incident incident = incidentRepository.findByTrackingNumber(trackingNumber)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
        return mapToIncidentResponseWithExtras(incident);
    }

    public List<IncidentResponse> getOfficeIncidents(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        OfficeAdmin officeAdmin = officeAdminService.findByUserEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User is not an office admin"));
        Office office = Office.valueOf(officeAdmin.getOfficeCode());
        return incidentRepository.findByAssignedOfficeOrderBySubmittedAtDesc(office)
            .stream()
            .map(this::mapToIncidentResponseWithExtras)
            .collect(Collectors.toList());
    }

    public IncidentResponse getIncidentById(String id, String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
        boolean isOfficeAdmin = officeAdminService.findByUserEmail(userEmail).isPresent();
        boolean isSubmitter = incident.getSubmittedBy().getEmail().equals(userEmail);
        if (!isOfficeAdmin && !isSubmitter) {
            throw new RuntimeException("Not authorized to view this incident");
        }
        // Get witnesses for this incident
        List<Witness> witnesses = witnessRepository.findByIncident(incident);
        
        // Get evidence for this incident
        List<Evidence> evidence = evidenceRepository.findByIncident(incident);
        
        // Create the response
        IncidentResponse response = mapToIncidentResponseWithExtras(incident);
        
        // Add witnesses and evidence to response
        response.setWitnesses(witnesses.stream()
            .map(w -> {
                IncidentResponse.WitnessDTO dto = new IncidentResponse.WitnessDTO();
                dto.setId(w.getId());
                dto.setName(w.getName());
                dto.setContactInformation(w.getContactInformation());
                dto.setAdditionalNotes(w.getAdditionalNotes());
                return dto;
            })
            .collect(Collectors.toList()));
            
        response.setEvidence(evidence.stream()
            .map(e -> {
                IncidentResponse.EvidenceDTO dto = new IncidentResponse.EvidenceDTO();
                dto.setId(e.getId());
                dto.setFileUrl(e.getFileUrl());
                dto.setFileName(e.getFileName());
                dto.setFileType(e.getFileType());
                dto.setFileSize(e.getFileSize());
                dto.setUploadedAt(e.getUploadedAt());
                return dto;
            })
            .collect(Collectors.toList()));
            
        return response;
    }

    @Transactional
    public IncidentResponse updateIncident(String id, String userEmail, IncidentUpdateRequest request) {
        User user = userService.getUserByEmail(userEmail);
        
        // Get the incident
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        // Check if user is authorized to update this incident
        boolean isOfficeAdmin = officeAdminService.findByUserEmail(userEmail).isPresent();
        if (!isOfficeAdmin) {
            throw new RuntimeException("Not authorized to update this incident");
        }

        // Store old status for comparison
        String oldStatus = incident.getStatus();

        // Update incident fields
        if (request.getStatus() != null) {
            incident.setStatus(request.getStatus());
        }
        if (request.getPriorityLevel() != null) {
            incident.setPriorityLevel(request.getPriorityLevel());
        }
        incident.setVerified(request.isVerified());
        
        // Save the updated incident
        Incident updatedIncident = incidentRepository.save(incident);

        // Create an incident update if a message is provided
        if (request.getUpdateMessage() != null && !request.getUpdateMessage().trim().isEmpty()) {
            IncidentUpdate update = new IncidentUpdate();
            update.setIncident(updatedIncident);
            update.setMessage(request.getUpdateMessage());
            update.setStatus(updatedIncident.getStatus());
            update.setUpdatedBy(user);
            update.setVisibleToReporter(request.isVisibleToReporter());
            update.setUpdatedByName(request.getUpdatedBy());
            
            // Add the updatedBy information to the activity log
            String updateInfo = request.getUpdatedBy() != null ? 
                " (Updated by: " + request.getUpdatedBy() + ")" : "";
            
            activityLogService.logActivity(
                "UPDATE",
                "Update provided" + updateInfo + ": " + request.getUpdateMessage(),
                updatedIncident,
                user
            );
            
            incidentUpdateRepository.save(update);
        }

        // Log activity for status change
        if (!oldStatus.equals(request.getStatus())) {
            String updateInfo = request.getUpdatedBy() != null ? 
                " by " + request.getUpdatedBy() : "";
            
            activityLogService.logActivity(
                "STATUS_CHANGE",
                "Case #" + incident.getTrackingNumber() + " status changed from '" + oldStatus + "' to '" + request.getStatus() + "'" + updateInfo,
                updatedIncident,
                user
            );
        }

        return IncidentResponse.fromIncident(updatedIncident);
    }

    public List<IncidentUpdateResponse> getIncidentUpdates(String id, String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        
        // Get the incident
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        // Check if user is authorized to view this incident
        boolean isOfficeAdmin = officeAdminService.findByUserEmail(userEmail).isPresent();
        boolean isSubmitter = incident.getSubmittedBy().getEmail().equals(userEmail);
        
        if (!isOfficeAdmin && !isSubmitter) {
            throw new RuntimeException("Not authorized to view this incident");
        }

        return incidentUpdateRepository.findByIncidentOrderByUpdatedAtDesc(incident)
            .stream()
            .map(update -> {
                IncidentUpdateResponse response = new IncidentUpdateResponse();
                response.setId(update.getId());
                response.setMessage(update.getMessage());
                response.setStatus(update.getStatus());
                response.setUpdatedByFullName(update.getUpdatedBy().getFullName());
                response.setUpdatedByName(update.getUpdatedByName());
                response.setUpdatedAt(update.getUpdatedAt());
                response.setVisibleToReporter(update.isVisibleToReporter());
                return response;
            })
            .collect(Collectors.toList());
    }

    public List<IncidentResponse> getInProgressIncidents(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        
        // Get the office admin details
        OfficeAdmin officeAdmin = officeAdminService.findByUserEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User is not an office admin"));

        // Get the office from the office admin's office name
        Office office = Office.valueOf(officeAdmin.getOfficeCode());

        return incidentRepository.findByAssignedOfficeAndStatusOrderBySubmittedAtDesc(office, "In Progress")
            .stream()
            .map(IncidentResponse::fromIncident)
            .collect(Collectors.toList());
    }

    public void createIncidentUpdate(String incidentId, String userEmail, String message, String status) {
        User user = userService.getUserByEmail(userEmail);

        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        // Check if user has permission to create updates
        OfficeAdmin officeAdmin = officeAdminService.findByUserEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User is not an office admin"));

        if (!incident.getAssignedOffice().equals(Office.valueOf(officeAdmin.getOfficeCode()))) {
            throw new RuntimeException("User does not have permission to update this incident");
        }

        IncidentUpdate update = new IncidentUpdate();
        update.setIncident(incident);
        update.setMessage(message);
        update.setStatus(status);
        update.setUpdatedBy(user);

        incidentUpdateRepository.save(update);

        // Update incident status
        incident.setStatus(status);
        incidentRepository.save(incident);
    }
} 