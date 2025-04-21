package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.IncidentRequest;
import com.teamhyungie.WildWatch.dto.IncidentResponse;
import com.teamhyungie.WildWatch.dto.IncidentUpdateRequest;
import com.teamhyungie.WildWatch.model.Evidence;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.Witness;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.repository.EvidenceRepository;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import com.teamhyungie.WildWatch.repository.WitnessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentService {
    private final IncidentRepository incidentRepository;
    private final WitnessRepository witnessRepository;
    private final EvidenceRepository evidenceRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final OfficeAdminService officeAdminService;

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
        witness.setStatement(witnessDTO.getStatement());
        return witness;
    }

    private Evidence createEvidence(MultipartFile file, Incident incident) {
        String storedFileName = fileStorageService.storeFile(file);
        
        Evidence evidence = new Evidence();
        evidence.setIncident(incident);
        evidence.setFileName(file.getOriginalFilename());
        evidence.setFileType(file.getContentType());
        evidence.setFileSize(file.getSize());
        evidence.setFileUrl("/uploads/" + storedFileName);
        
        return evidence;
    }

    public List<IncidentResponse> getUserIncidents(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        return incidentRepository.findBySubmittedByOrderBySubmittedAtDesc(user)
            .stream()
            .map(IncidentResponse::fromIncident)
            .collect(Collectors.toList());
    }

    public IncidentResponse getIncidentByTrackingNumber(String trackingNumber) {
        Incident incident = incidentRepository.findByTrackingNumber(trackingNumber)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
        return IncidentResponse.fromIncident(incident);
    }

    public List<IncidentResponse> getOfficeIncidents(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        
        // Get the office admin details
        OfficeAdmin officeAdmin = officeAdminService.findByUserEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User is not an office admin"));

        // Get the office from the office admin's office name
        Office office = Office.valueOf(officeAdmin.getOfficeCode());

        return incidentRepository.findByAssignedOfficeOrderBySubmittedAtDesc(office)
            .stream()
            .map(IncidentResponse::fromIncident)
            .collect(Collectors.toList());
    }

    public IncidentResponse getIncidentById(String id, String userEmail) {
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

        // Get witnesses for this incident
        List<Witness> witnesses = witnessRepository.findByIncident(incident);
        
        // Get evidence for this incident
        List<Evidence> evidence = evidenceRepository.findByIncident(incident);
        
        // Create the response
        IncidentResponse response = IncidentResponse.fromIncident(incident);
        
        // Add witnesses and evidence to response
        response.setWitnesses(witnesses.stream()
            .map(w -> {
                IncidentResponse.WitnessDTO dto = new IncidentResponse.WitnessDTO();
                dto.setId(w.getId());
                dto.setName(w.getName());
                dto.setContactInformation(w.getContactInformation());
                dto.setStatement(w.getStatement());
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

        // Update incident fields
        incident.setStatus(request.getStatus());
        incident.setPriorityLevel(request.getPriorityLevel());
        incident.setVerified(request.isVerified());
        
        // Save the updated incident
        Incident updatedIncident = incidentRepository.save(incident);
        
        return IncidentResponse.fromIncident(updatedIncident);
    }
} 