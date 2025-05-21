package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.IncidentRequest;
import com.teamhyungie.WildWatch.dto.IncidentResponse;
import com.teamhyungie.WildWatch.dto.IncidentUpdateRequest;
import com.teamhyungie.WildWatch.dto.IncidentUpdateResponse;
import com.teamhyungie.WildWatch.dto.IncidentTransferRequest;
import com.teamhyungie.WildWatch.model.Evidence;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.Witness;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.model.IncidentUpdate;
import com.teamhyungie.WildWatch.model.IncidentUpvote;
import com.teamhyungie.WildWatch.repository.EvidenceRepository;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import com.teamhyungie.WildWatch.repository.WitnessRepository;
import com.teamhyungie.WildWatch.repository.IncidentUpdateRepository;
import com.teamhyungie.WildWatch.repository.IncidentUpvoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.Optional;

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
    private final IncidentUpvoteRepository incidentUpvoteRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TagGenerationService tagGenerationService;
    private final OfficeAssignmentService officeAssignmentService;

    @Transactional
    public IncidentResponse createIncident(IncidentRequest request, String userEmail, List<MultipartFile> files) {
        User user = userService.getUserByEmail(userEmail);
        
        // Use tags from request if provided, otherwise generate tags using AI
        List<String> tags = (request.getTags() != null && !request.getTags().isEmpty())
            ? request.getTags()
            : tagGenerationService.generateTags(request.getDescription(), request.getLocation());
        
        // If no office is assigned in the request, use AI to assign one
        Office assignedOffice = request.getAssignedOffice();
        if (assignedOffice == null) {
            assignedOffice = officeAssignmentService.assignOffice(request.getDescription(), request.getLocation(), tags);
        }
        
        // Create and save the incident first
        final Incident savedIncident = createAndSaveIncident(request, user, tags);
        savedIncident.setAssignedOffice(assignedOffice);
        incidentRepository.save(savedIncident);

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

        // Notify all admins of the assigned office
        if (request.getAssignedOffice() != null) {
            List<OfficeAdmin> officeAdmins = officeAdminService.findAllActive().stream()
                .filter(admin -> admin.getOfficeCode().equals(request.getAssignedOffice().name()))
                .collect(Collectors.toList());
            for (OfficeAdmin admin : officeAdmins) {
                User adminUser = admin.getUser();
                activityLogService.logActivity(
                    "NEW_CASE_ASSIGNED",
                    "A new case has been reported and assigned to your office.",
                    savedIncident,
                    adminUser
                );
            }
        }

        return IncidentResponse.fromIncident(savedIncident);
    }

    private Incident createAndSaveIncident(IncidentRequest request, User user, List<String> tags) {
        Incident incident = new Incident();
        incident.setIncidentType(request.getIncidentType());
        incident.setDateOfIncident(request.getDateOfIncident());
        incident.setTimeOfIncident(request.getTimeOfIncident());
        incident.setLocation(request.getLocation());
        incident.setDescription(request.getDescription());
        incident.setAssignedOffice(request.getAssignedOffice());
        incident.setSubmittedBy(user);
        incident.setPreferAnonymous(request.getPreferAnonymous());
        incident.setTags(tags);
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

        // Set transfer information
        List<IncidentUpdate> updates = incidentUpdateRepository.findByIncidentOrderByUpdatedAtDesc(incident);
        for (IncidentUpdate update : updates) {
            if (update.getMessage().startsWith("Case transferred from")) {
                String[] parts = update.getMessage().split(" from ")[1].split(" to ");
                if (parts.length >= 1) {
                    response.setTransferredFrom(parts[0]);
                }
                break;
            }
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

    public List<IncidentResponse> getPublicIncidents() {
        return incidentRepository.findAll()
            .stream()
            .filter(incident -> incident.getIsAnonymous() == null || !incident.getIsAnonymous())
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
        boolean wasVerified = incident.getVerified();

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

        // Log verification activity if verification status changed
        if (request.isVerified() && !wasVerified) {
            String updateInfo = request.getUpdatedBy() != null ? 
                " by " + request.getUpdatedBy() : "";
            
            // Get the office name
            String officeName = incident.getAssignedOffice().name();

            // Log verification activity for admin
            activityLogService.logActivity(
                "VERIFICATION",
                "Case #" + incident.getTrackingNumber() + " has been verified" + updateInfo,
                updatedIncident,
                user
            );

            // Log verification activity for the submitter
            activityLogService.logActivity(
                "VERIFICATION",
                "Your case #" + incident.getTrackingNumber() + " has been verified by " + officeName + " and is back to pending",
                updatedIncident,
                incident.getSubmittedBy()
            );

            // If this was a transferred case, notify the transferring office
            if (incident.getTransferredFrom() != null) {
                String fromOffice = incident.getTransferredFrom();
                String toOffice = incident.getAssignedOffice().name();
                String fromOfficeFull = Office.valueOf(fromOffice).getFullName();
                String toOfficeFull = Office.valueOf(toOffice).getFullName();

                List<OfficeAdmin> transferringAdmins = officeAdminService.findAllActive().stream()
                    .filter(admin -> admin.getOfficeCode().equals(fromOffice))
                    .collect(Collectors.toList());

                for (OfficeAdmin admin : transferringAdmins) {
                    User adminUser = admin.getUser();
                    activityLogService.logActivity(
                        "TRANSFER_APPROVED",
                        "Case #" + incident.getTrackingNumber() + " which was transferred from " + fromOfficeFull + " to " + toOfficeFull + " has been approved and verified by " + toOfficeFull + ".",
                        updatedIncident,
                        adminUser
                    );
                }
                // Clear transferredFrom so the previous office is not notified again
                incident.setTransferredFrom(null);
                incidentRepository.save(incident);
            }

            // Create an incident update for verification
            IncidentUpdate verificationUpdate = new IncidentUpdate();
            verificationUpdate.setIncident(updatedIncident);
            verificationUpdate.setMessage("Case has been verified" + updateInfo);
            verificationUpdate.setStatus(updatedIncident.getStatus());
            verificationUpdate.setUpdatedBy(user);
            verificationUpdate.setVisibleToReporter(true);
            verificationUpdate.setUpdatedByName(request.getUpdatedBy());
            
            incidentUpdateRepository.save(verificationUpdate);
        }

        // Create an incident update if a message is provided
        if (request.getUpdateMessage() != null && !request.getUpdateMessage().trim().isEmpty()) {
            IncidentUpdate update = new IncidentUpdate();
            update.setIncident(updatedIncident);
            update.setMessage(request.getUpdateMessage());
            update.setStatus(updatedIncident.getStatus());
            update.setUpdatedBy(user);
            update.setVisibleToReporter(request.isVisibleToReporter());
            update.setUpdatedByName(request.getUpdatedBy());
            
            // Add the updatedBy information to the activity log for admin
            String updateInfo = request.getUpdatedBy() != null ? 
                " (Updated by: " + request.getUpdatedBy() + ")" : "";
            
            activityLogService.logActivity(
                "UPDATE",
                "Update provided" + updateInfo + ": " + request.getUpdateMessage(),
                updatedIncident,
                user
            );

            // Log update activity for the submitter if visible to reporter
            if (request.isVisibleToReporter()) {
                activityLogService.logActivity(
                    "UPDATE",
                    "New update for case #" + incident.getTrackingNumber() + updateInfo + ": " + request.getUpdateMessage(),
                    updatedIncident,
                    incident.getSubmittedBy()
                );
            }
            
            incidentUpdateRepository.save(update);
        }

        // Log activity for status change
        if (!oldStatus.equals(request.getStatus())) {
            String updateInfo = request.getUpdatedBy() != null ? 
                " by " + request.getUpdatedBy() : "";
            
            // Log status change for admin
            activityLogService.logActivity(
                "STATUS_CHANGE",
                "Case #" + incident.getTrackingNumber() + " status changed from '" + oldStatus + "' to '" + request.getStatus() + "'" + updateInfo,
                updatedIncident,
                user
            );

            // Log status change for the submitter
            activityLogService.logActivity(
                "STATUS_CHANGE",
                "Your case #" + incident.getTrackingNumber() + " status has been updated to '" + request.getStatus() + "'" + updateInfo,
                updatedIncident,
                incident.getSubmittedBy()
            );

            // Clear lastTransferredTo if resolved or closed
            if (request.getStatus() != null && 
                (request.getStatus().equalsIgnoreCase("resolved") || request.getStatus().equalsIgnoreCase("closed"))) {
                incident.setLastTransferredTo(null);
                incidentRepository.save(incident);
            }
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

    @Transactional
    public IncidentResponse transferIncident(String id, String userEmail, IncidentTransferRequest request) {
        User user = userService.getUserByEmail(userEmail);
        
        // Get the incident
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        // Check if user is authorized to transfer this incident
        boolean isOfficeAdmin = officeAdminService.findByUserEmail(userEmail).isPresent();
        if (!isOfficeAdmin) {
            throw new RuntimeException("Not authorized to transfer this incident");
        }

        // Store old office for comparison
        Office oldOffice = incident.getAssignedOffice();

        // Update incident office
        incident.setAssignedOffice(request.getNewOffice());
        // Set transferredFrom to the old office code
        incident.setTransferredFrom(oldOffice != null ? oldOffice.name() : null);
        // Set lastTransferredTo to the new office code
        incident.setLastTransferredTo(request.getNewOffice().name());
        // Set lastTransferNotes to the transfer notes
        incident.setLastTransferNotes(request.getTransferNotes());
        Incident updatedIncident = incidentRepository.save(incident);

        // Create an incident update for the transfer
        IncidentUpdate transferUpdate = new IncidentUpdate();
        transferUpdate.setIncident(updatedIncident);
        transferUpdate.setMessage(
            "Case #" + incident.getTrackingNumber() + " transferred from " + oldOffice + " to " + request.getNewOffice() +
            (request.getTransferNotes() != null && !request.getTransferNotes().trim().isEmpty()
                ? ". Notes: " + request.getTransferNotes()
                : "")
        );
        transferUpdate.setStatus(updatedIncident.getStatus());
        transferUpdate.setUpdatedBy(user);
        transferUpdate.setVisibleToReporter(true);
        transferUpdate.setUpdatedByName(user.getFirstName() + " " + user.getLastName());
        
        IncidentUpdate savedUpdate = incidentUpdateRepository.save(transferUpdate);
        System.out.println("Saved transfer update: " + savedUpdate.getMessage() + " for incident " + updatedIncident.getId());

        // Log transfer activity for admin
        activityLogService.logActivity(
            "TRANSFER",
            "Case #" + incident.getTrackingNumber() + " transferred from " + oldOffice + " to " + request.getNewOffice(),
            updatedIncident,
            user
        );

        // Log transfer activity for the submitter
        activityLogService.logActivity(
            "TRANSFER",
            "Your case #" + incident.getTrackingNumber() + " has been transferred to " + request.getNewOffice(),
            updatedIncident,
            incident.getSubmittedBy()
        );

        // Log transfer activity for all admins of the receiving office
        List<OfficeAdmin> receivingAdmins = officeAdminService.findAllActive().stream()
            .filter(admin -> admin.getOfficeCode().equals(request.getNewOffice().name()))
            .collect(Collectors.toList());
        for (OfficeAdmin admin : receivingAdmins) {
            User adminUser = admin.getUser();
            activityLogService.logActivity(
                "TRANSFER_RECEIVED",
                "A case #" + incident.getTrackingNumber() + " has been transferred to your office (" + request.getNewOffice() + ")" +
                (request.getTransferNotes() != null && !request.getTransferNotes().trim().isEmpty()
                    ? ". Notes: " + request.getTransferNotes()
                    : ""),
                updatedIncident,
                adminUser
            );
        }

        return IncidentResponse.fromIncident(updatedIncident);
    }

    public boolean toggleUpvote(String incidentId, String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        // Defensive: always default upvoteCount to 0 if null
        if (incident.getUpvoteCount() == null) {
            incident.setUpvoteCount(0);
        }

        Optional<IncidentUpvote> existingUpvote = incidentUpvoteRepository.findByIncidentAndUser(incident, user);

        if (existingUpvote.isPresent()) {
            // Remove upvote
            incidentUpvoteRepository.delete(existingUpvote.get());
            incident.setUpvoteCount(incident.getUpvoteCount() - 1);
            incidentRepository.save(incident);
            // Broadcast new count
            messagingTemplate.convertAndSend(
                "/topic/upvotes/" + incident.getId(),
                incident.getUpvoteCount()
            );
            return false;
        } else {
            // Add upvote
            IncidentUpvote upvote = new IncidentUpvote();
            upvote.setIncident(incident);
            upvote.setUser(user);
            incidentUpvoteRepository.save(upvote);
            incident.setUpvoteCount(incident.getUpvoteCount() + 1);
            incidentRepository.save(incident);
            // Broadcast new count
            messagingTemplate.convertAndSend(
                "/topic/upvotes/" + incident.getId(),
                incident.getUpvoteCount()
            );

            // Create notification for the incident creator
            if (!user.getId().equals(incident.getSubmittedBy().getId())) {
                activityLogService.logActivity(
                    "UPVOTE",
                    "Your incident #" + incident.getTrackingNumber() + " received an upvote",
                    incident,
                    incident.getSubmittedBy()
                );
            }
            return true;
        }
    }

    public boolean hasUserUpvoted(String incidentId, String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
        return incidentUpvoteRepository.existsByIncidentAndUser(incident, user);
    }
} 