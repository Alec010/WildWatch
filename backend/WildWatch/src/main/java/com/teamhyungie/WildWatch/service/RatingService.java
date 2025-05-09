package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.LeaderboardEntry;
import com.teamhyungie.WildWatch.dto.RatingRequest;
import com.teamhyungie.WildWatch.dto.IncidentRatingResponse;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.IncidentRating;
import com.teamhyungie.WildWatch.repository.IncidentRatingRepository;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RatingService {

    @Autowired
    private IncidentRatingRepository ratingRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    private static final int MIN_RATINGS_THRESHOLD = 5;

    @Transactional
    public IncidentRatingResponse rateReporter(String incidentId, RatingRequest request) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        if (!"RESOLVED".equalsIgnoreCase(incident.getStatus())) {
            throw new RuntimeException("Can only rate resolved incidents");
        }

        IncidentRating rating = ratingRepository.findByIncidentId(incidentId)
                .orElse(new IncidentRating());

        rating.setIncident(incident);
        rating.setReporterRating(request.getRating());
        rating.setReporterFeedback(request.getFeedback());

        IncidentRating savedRating = ratingRepository.save(rating);
        return mapToResponse(savedRating);
    }

    @Transactional
    public IncidentRatingResponse rateOffice(String incidentId, RatingRequest request) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        if (!"RESOLVED".equalsIgnoreCase(incident.getStatus())) {
            throw new RuntimeException("Can only rate resolved incidents");
        }

        IncidentRating rating = ratingRepository.findByIncidentId(incidentId)
                .orElse(new IncidentRating());

        rating.setIncident(incident);
        rating.setOfficeRating(request.getRating());
        rating.setOfficeFeedback(request.getFeedback());

        IncidentRating savedRating = ratingRepository.save(rating);
        return mapToResponse(savedRating);
    }

    private IncidentRatingResponse mapToResponse(IncidentRating rating) {
        return new IncidentRatingResponse(
            rating.getIncident().getId(),
            rating.getReporterRating(),
            rating.getReporterFeedback(),
            rating.getOfficeRating(),
            rating.getOfficeFeedback()
        );
    }

    public List<LeaderboardEntry> getTopReporters() {
        return ratingRepository.getTopReporters(MIN_RATINGS_THRESHOLD).stream()
                .map(row -> new LeaderboardEntry(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).intValue(),
                        ((Number) row[4]).doubleValue()
                ))
                .collect(Collectors.toList());
    }

    public List<LeaderboardEntry> getMostActiveReporters() {
        return ratingRepository.getMostActiveReporters().stream()
                .map(row -> new LeaderboardEntry(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).intValue()
                ))
                .collect(Collectors.toList());
    }

    public List<LeaderboardEntry> getTopOffices() {
        return ratingRepository.getTopOffices(MIN_RATINGS_THRESHOLD).stream()
                .map(row -> new LeaderboardEntry(
                        (Long) row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue(),
                        ((Number) row[3]).doubleValue()
                ))
                .collect(Collectors.toList());
    }

    public List<LeaderboardEntry> getMostActiveOffices() {
        return ratingRepository.getMostActiveOffices().stream()
                .map(row -> new LeaderboardEntry(
                        (Long) row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue()
                ))
                .collect(Collectors.toList());
    }
} 