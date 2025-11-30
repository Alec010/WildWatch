package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.service.ModerationService;
import com.teamhyungie.WildWatch.service.OfficeAssignmentService;
import com.teamhyungie.WildWatch.service.TagGenerationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentAnalysisController {

    private final TagGenerationService tagGenerationService;
    private final OfficeAssignmentService officeAssignmentService;
    private final ModerationService moderationService;
    private final com.teamhyungie.WildWatch.service.OfficeAdminService officeAdminService;
    private final com.teamhyungie.WildWatch.service.SimilarityService similarityService;
    private final com.teamhyungie.WildWatch.service.IncidentClassificationService incidentClassificationService;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(@RequestBody AnalyzeRequest req) {
        // Build enhanced location like IncidentService
        // Make it final so it can be used in lambda expressions
        final String enhancedLocation;
        if (req.buildingName != null && !req.buildingName.isBlank()) {
            enhancedLocation = req.buildingName + " - " + req.location;
        } else if (req.formattedAddress != null && !req.formattedAddress.isBlank()) {
            enhancedLocation = req.formattedAddress + " - " + req.location;
        } else {
            enhancedLocation = req.location;
        }

        // Use provided tags from step 1, or generate if not provided (fallback)
        List<String> tags = (req.tags != null && !req.tags.isEmpty())
                ? req.tags
                : tagGenerationService.generateTags(req.description, enhancedLocation, req.incidentType);
        
        // Collect office names from office_admins (cached for performance)
        var officeNames = officeAdminService.getOfficeNames();
        
        // PARALLEL PROCESSING: Run independent AI operations concurrently
        // These three operations don't depend on each other, so they can run in parallel
        java.util.concurrent.CompletableFuture<Office> officeFuture = 
            java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                officeAssignmentService.assignOffice(req.description, enhancedLocation, tags));
        
        java.util.concurrent.CompletableFuture<Boolean> isIncidentFuture = 
            java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                incidentClassificationService.isRealIncident(req.incidentType, req.description));
        
        java.util.concurrent.CompletableFuture<ModerationService.Result> moderationFuture = 
            java.util.concurrent.CompletableFuture.supplyAsync(() -> 
                moderationService.review(req.incidentType, req.description, enhancedLocation, tags, officeNames));
        
        // Wait for all parallel operations to complete
        try {
            Office office = officeFuture.get();
            boolean isIncident = isIncidentFuture.get();
            ModerationService.Result mod = moderationFuture.get();

            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("decision", mod.decision.name());
            payload.put("confidence", mod.confidence);
            payload.put("reasons", mod.reasons);
            payload.put("suggestedTags", tags);
            payload.put("suggestedOffice", office.name());
            payload.put("normalizedLocation", enhancedLocation);
            payload.put("isIncident", isIncident);

            if ("ALLOW".equalsIgnoreCase(mod.decision.name())) {
                // Use tag-based similarity (Jaccard similarity on all 20 tags)
                var similars = similarityService.findSimilarByTags(tags, 3);
                payload.put("similarIncidents", similars);
            }

            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            // Fallback to sequential processing if parallel fails
            Office office = officeAssignmentService.assignOffice(req.description, enhancedLocation, tags);
            boolean isIncident = incidentClassificationService.isRealIncident(req.incidentType, req.description);
            ModerationService.Result mod = moderationService.review(req.incidentType, req.description, enhancedLocation, tags, officeNames);
            
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("decision", mod.decision.name());
            payload.put("confidence", mod.confidence);
            payload.put("reasons", mod.reasons);
            payload.put("suggestedTags", tags);
            payload.put("suggestedOffice", office.name());
            payload.put("normalizedLocation", enhancedLocation);
            payload.put("isIncident", isIncident);
            
            if ("ALLOW".equalsIgnoreCase(mod.decision.name())) {
                var similars = similarityService.findSimilarByTags(tags, 3);
                payload.put("similarIncidents", similars);
            }
            
            return ResponseEntity.ok(payload);
        }
    }

    @Data
    public static class AnalyzeRequest {
        public String incidentType;
        public String description;
        public String location;
        public String formattedAddress;
        public String buildingName;
        public String buildingCode;
        public Double latitude;
        public Double longitude;
        public List<String> tags; // All 20 tags from step 1 (optional, fallback to generation)
    }
}


