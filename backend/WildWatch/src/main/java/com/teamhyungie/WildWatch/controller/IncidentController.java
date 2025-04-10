package com.teamhyungie.WildWatch.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamhyungie.WildWatch.dto.IncidentRequest;
import com.teamhyungie.WildWatch.dto.IncidentResponse;
import com.teamhyungie.WildWatch.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IncidentController {
    private final IncidentService incidentService;
    private final ObjectMapper objectMapper;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "video/mp4",
        "video/quicktime"
    );

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createIncident(
            @RequestParam("incidentData") String incidentDataJson,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Validate file types
            if (files != null) {
                for (MultipartFile file : files) {
                    if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
                        return ResponseEntity.badRequest()
                            .body(Map.of("error", 
                                "Unsupported file type: " + file.getContentType() + 
                                ". Allowed types are: " + String.join(", ", ALLOWED_CONTENT_TYPES)));
                    }
                }
            }

            IncidentRequest request = objectMapper.readValue(incidentDataJson, IncidentRequest.class);
            IncidentResponse response = incidentService.createIncident(request, userDetails.getUsername(), files);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to create incident: " + e.getMessage()));
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
} 