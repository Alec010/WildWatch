package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.service.TagGenerationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {
    private final TagGenerationService tagGenerationService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateTags(@RequestBody TagRequest request) {
        try {
            // Build enhanced location context similar to IncidentService
            StringBuilder enhanced = new StringBuilder();
            if (request.getBuildingCode() != null && !request.getBuildingCode().isBlank()) {
                enhanced.append(request.getBuildingCode());
                if (request.getBuildingName() != null && !request.getBuildingName().isBlank()) {
                    enhanced.append(" - ").append(request.getBuildingName());
                }
                enhanced.append(" | ");
            } else if (request.getBuildingName() != null && !request.getBuildingName().isBlank()) {
                enhanced.append(request.getBuildingName()).append(" | ");
            }
            if (request.getFormattedAddress() != null && !request.getFormattedAddress().isBlank()) {
                enhanced.append(request.getFormattedAddress()).append(" | ");
            }
            if (request.getLocation() != null && !request.getLocation().isBlank()) {
                enhanced.append(request.getLocation());
            }
            if (request.getLatitude() != null && request.getLongitude() != null) {
                enhanced.append(" (lat:").append(request.getLatitude())
                        .append(", lng:").append(request.getLongitude()).append(")");
            }

            String enhancedLocation = enhanced.toString();

            List<String> tags = tagGenerationService.generateTags(request.getDescription(), enhancedLocation, request.getIncidentType());
            if (tags.size() > 10) tags = tags.subList(0, 10);
            return ResponseEntity.ok(Map.of("tags", tags));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Data
    public static class TagRequest {
        private String description;
        private String incidentType;
        private String location;
        private String formattedAddress;
        private String buildingName;
        private String buildingCode;
        private Double latitude;
        private Double longitude;
    }
} 