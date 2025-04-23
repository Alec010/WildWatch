package com.teamhyungie.WildWatch.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamhyungie.WildWatch.dto.IncidentRequest;
import com.teamhyungie.WildWatch.dto.IncidentResponse;
import com.teamhyungie.WildWatch.dto.IncidentUpdateRequest;
import com.teamhyungie.WildWatch.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IncidentController {
    private final IncidentService incidentService;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IncidentResponse> createIncident(
            @RequestParam("incidentData") String incidentDataJson,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            IncidentRequest request = objectMapper.readValue(incidentDataJson, IncidentRequest.class);
            IncidentResponse response = incidentService.createIncident(request, userDetails.getUsername(), files);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/my-incidents")
    public ResponseEntity<List<IncidentResponse>> getUserIncidents(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IncidentResponse> incidents = incidentService.getUserIncidents(userDetails.getUsername());
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<IncidentResponse> getIncidentByTrackingNumber(
            @PathVariable String trackingNumber) {
        IncidentResponse incident = incidentService.getIncidentByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(incident);
    }

    @GetMapping("/office")
    public ResponseEntity<List<IncidentResponse>> getOfficeIncidents(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IncidentResponse> incidents = incidentService.getOfficeIncidents(userDetails.getUsername());
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncidentById(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        IncidentResponse incident = incidentService.getIncidentById(id, userDetails.getUsername());
        return ResponseEntity.ok(incident);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncidentResponse> updateIncident(
            @PathVariable String id,
            @RequestBody IncidentUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            IncidentResponse response = incidentService.updateIncident(id, userDetails.getUsername(), request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
} 