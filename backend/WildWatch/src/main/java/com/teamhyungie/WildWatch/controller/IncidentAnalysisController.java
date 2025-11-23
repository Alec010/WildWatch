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

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(@RequestBody AnalyzeRequest req) {
        // Build enhanced location like IncidentService
        String enhancedLocation = req.location;
        if (req.buildingName != null && !req.buildingName.isBlank()) {
            enhancedLocation = req.buildingName + " - " + req.location;
        } else if (req.formattedAddress != null && !req.formattedAddress.isBlank()) {
            enhancedLocation = req.formattedAddress + " - " + req.location;
        }

        List<String> tags = tagGenerationService.generateTags(req.description, enhancedLocation, req.incidentType);
        Office office = officeAssignmentService.assignOffice(req.description, enhancedLocation, tags);
        // Collect office names from office_admins to help detect disparagement
        var officeNames = officeAdminService.findAllActive().stream()
                .map(oa -> oa.getOfficeName())
                .toList();
        ModerationService.Result mod = moderationService.review(req.incidentType, req.description, enhancedLocation, tags, officeNames);

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("decision", mod.decision.name());
        payload.put("confidence", mod.confidence);
        payload.put("reasons", mod.reasons);
        payload.put("suggestedTags", tags);
        payload.put("suggestedOffice", office.name());
        payload.put("normalizedLocation", enhancedLocation);

        if ("ALLOW".equalsIgnoreCase(mod.decision.name())) {
            // Use tag-based similarity (Jaccard similarity on all 20 tags)
            // Tags are already generated above (line 36)
            var similars = similarityService.findSimilarByTags(tags, 3);
            payload.put("similarIncidents", similars);
        }

        return ResponseEntity.ok(payload);
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
    }
}


