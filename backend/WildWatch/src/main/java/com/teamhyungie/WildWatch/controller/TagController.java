package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.TagScore;
import com.teamhyungie.WildWatch.service.TagGenerationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

            // Generate all 20 tags
            List<String> allTags = tagGenerationService.generateTags(request.getDescription(), enhancedLocation, request.getIncidentType());

            // Get top 5 scored tags
            List<TagScore> topScoredTags = tagGenerationService.generateScoredTags(request.getDescription(), enhancedLocation, request.getIncidentType());

            // Extract tag strings from top 5
            List<String> top5Tags = topScoredTags.stream()
                    .map(TagScore::getTag)
                    .collect(Collectors.toList());

            // Return all 20 tags, top 5 scored tags with details, and top 5 tag strings
            return ResponseEntity.ok(Map.of(
                    "allTags", allTags,
                    "top5ScoredTags", topScoredTags,
                    "top5Tags", top5Tags,
                    "totalGenerated", allTags.size()
            ));
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
