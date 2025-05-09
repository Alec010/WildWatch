package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.IncidentRatingResponse;
import com.teamhyungie.WildWatch.dto.LeaderboardEntry;
import com.teamhyungie.WildWatch.dto.RatingRequest;
import com.teamhyungie.WildWatch.service.RatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;

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
} 