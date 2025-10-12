package com.teamhyungie.WildWatch.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamhyungie.WildWatch.dto.IncidentRequest;
import com.teamhyungie.WildWatch.dto.IncidentResponse;
import com.teamhyungie.WildWatch.dto.IncidentUpdateRequest;
import com.teamhyungie.WildWatch.dto.IncidentUpdateResponse;
import com.teamhyungie.WildWatch.dto.IncidentTransferRequest;
import com.teamhyungie.WildWatch.dto.BulkIncidentUpdateRequest;
import com.teamhyungie.WildWatch.service.IncidentService;
import com.teamhyungie.WildWatch.service.IncidentService.BulkResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@Tag(name = "Incidents", description = "Incident reporting and management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class IncidentController {

    private final IncidentService incidentService;
    private final ObjectMapper objectMapper;

    @Operation(summary = "Create a new incident", description = "Report a new incident with optional file attachments")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Incident created successfully",
                content = @Content(schema = @Schema(implementation = IncidentResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid incident data")
    })
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

    @Operation(summary = "Get user's incidents", description = "Retrieve all incidents reported by the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Incidents retrieved successfully")
    })
    @GetMapping("/my-incidents")
    public ResponseEntity<List<IncidentResponse>> getUserIncidents(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IncidentResponse> incidents = incidentService.getUserIncidents(userDetails.getUsername());
        return ResponseEntity.ok(incidents);
    }
    
    @GetMapping("/my-active-cases")
    public ResponseEntity<List<IncidentResponse>> getActiveCases(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IncidentResponse> incidents = incidentService.getActiveCases(userDetails.getUsername());
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/public")
    public ResponseEntity<List<IncidentResponse>> getPublicIncidents() {
        List<IncidentResponse> incidents = incidentService.getPublicIncidents();
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
    
    @GetMapping("/office/verified")
    public ResponseEntity<List<IncidentResponse>> getVerifiedCases(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IncidentResponse> incidents = incidentService.getVerifiedCases(userDetails.getUsername());
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

    @GetMapping("/in-progress")
    public ResponseEntity<List<IncidentResponse>> getInProgressIncidents(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IncidentResponse> incidents = incidentService.getInProgressIncidents(userDetails.getUsername());
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/{id}/updates")
    public ResponseEntity<List<IncidentUpdateResponse>> getIncidentUpdates(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IncidentUpdateResponse> updates = incidentService.getIncidentUpdates(id, userDetails.getUsername());
        return ResponseEntity.ok(updates);
    }

    @PostMapping("/{id}/transfer")
    public ResponseEntity<IncidentResponse> transferIncident(
            @PathVariable String id,
            @RequestBody IncidentTransferRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            IncidentResponse response = incidentService.transferIncident(id, userDetails.getUsername(), request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/upvote")
    public ResponseEntity<Boolean> toggleUpvote(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        boolean isUpvoted = incidentService.toggleUpvote(id, userDetails.getUsername());
        return ResponseEntity.ok(isUpvoted);
    }

    @GetMapping("/{id}/upvote-status")
    public ResponseEntity<Boolean> getUpvoteStatus(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        boolean hasUpvoted = incidentService.hasUserUpvoted(id, userDetails.getUsername());
        return ResponseEntity.ok(hasUpvoted);
    }

    @PostMapping("/{id}/extend-resolution")
    public ResponseEntity<IncidentResponse> extendResolutionDate(
            @PathVariable String id,
            @RequestBody ExtendResolutionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        IncidentResponse response = incidentService.extendResolutionDate(id, request.getNewEstimatedDate(), userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk/resolve")
    public ResponseEntity<BulkResult> bulkResolve(
            @jakarta.validation.Valid @RequestBody BulkIncidentUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        BulkResult result = incidentService.bulkResolve(userDetails.getUsername(), request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bulk/dismiss")
    public ResponseEntity<BulkResult> bulkDismiss(
            @jakarta.validation.Valid @RequestBody BulkIncidentUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        BulkResult result = incidentService.bulkDismiss(userDetails.getUsername(), request);
        return ResponseEntity.ok(result);
    }

    public static class ExtendResolutionRequest {

        private LocalDateTime newEstimatedDate;

        public LocalDateTime getNewEstimatedDate() {
            return newEstimatedDate;
        }

        public void setNewEstimatedDate(LocalDateTime newEstimatedDate) {
            this.newEstimatedDate = newEstimatedDate;
        }
    }
}
