package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.IncidentRequest;
import com.teamhyungie.WildWatch.dto.IncidentResponse;
import com.teamhyungie.WildWatch.model.Evidence;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.Witness;
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
            .orElseThrow(() -> new RuntimeException("Incident not found with tracking number: " + trackingNumber));
        return IncidentResponse.fromIncident(incident);
    }
} 