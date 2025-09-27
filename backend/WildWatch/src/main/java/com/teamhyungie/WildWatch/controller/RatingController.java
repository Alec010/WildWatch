package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.IncidentRatingResponse;
import com.teamhyungie.WildWatch.dto.LeaderboardEntry;
import com.teamhyungie.WildWatch.dto.RatingRequest;
import com.teamhyungie.WildWatch.service.RatingService;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import com.teamhyungie.WildWatch.repository.IncidentRatingRepository;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.IncidentRating;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private IncidentRatingRepository ratingRepository;

    @PostMapping("/incidents/{incidentId}/reporter")
    public ResponseEntity<IncidentRatingResponse> rateReporter(
            @PathVariable String incidentId,
            @RequestBody RatingRequest request) {
        return ResponseEntity.ok(ratingService.rateReporter(incidentId, request));
    }

    @PostMapping("/incidents/{incidentId}/office")
    public ResponseEntity<IncidentRatingResponse> rateOffice(
            @PathVariable String incidentId,
            @RequestBody RatingRequest request) {
        return ResponseEntity.ok(ratingService.rateOffice(incidentId, request));
    }

    @GetMapping("/leaderboard/reporters/top")
    public ResponseEntity<List<LeaderboardEntry>> getTopReporters() {
        return ResponseEntity.ok(ratingService.getTopReporters());
    }

    @GetMapping("/leaderboard/reporters/active")
    public ResponseEntity<List<LeaderboardEntry>> getMostActiveReporters() {
        return ResponseEntity.ok(ratingService.getMostActiveReporters());
    }

    @GetMapping("/leaderboard/offices/top")
    public ResponseEntity<List<LeaderboardEntry>> getTopOffices() {
        return ResponseEntity.ok(ratingService.getTopOffices());
    }

    @GetMapping("/leaderboard/offices/active")
    public ResponseEntity<List<LeaderboardEntry>> getMostActiveOffices() {
        return ResponseEntity.ok(ratingService.getMostActiveOffices());
    }

    @GetMapping("/incidents/{incidentIdOrTrackingNumber}")
    public ResponseEntity<IncidentRatingResponse> getIncidentRating(
            @PathVariable String incidentIdOrTrackingNumber) {
        // Try by tracking number first, then by ID if needed
        Incident incident = incidentRepository.findByTrackingNumber(incidentIdOrTrackingNumber)
            .orElseGet(() -> incidentRepository.findById(incidentIdOrTrackingNumber).orElse(null));
        if (incident == null) {
            return ResponseEntity.notFound().build();
        }
        Optional<IncidentRating> ratingOpt = ratingRepository.findByIncidentId(incident.getId());
        if (ratingOpt.isEmpty()) {
            return ResponseEntity.ok(new IncidentRatingResponse(
                incident.getId(), null, null, false, 0, 0
            ));
        }
        IncidentRating rating = ratingOpt.get();
        return ResponseEntity.ok(ratingService.mapToResponse(rating));
    }
} 