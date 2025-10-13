package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.LeaderboardEntry;
import com.teamhyungie.WildWatch.dto.RatingRequest;
import com.teamhyungie.WildWatch.dto.IncidentRatingResponse;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.IncidentRating;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.repository.IncidentRatingRepository;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import com.teamhyungie.WildWatch.service.UserService;
import com.teamhyungie.WildWatch.service.OfficeAdminService;
import com.teamhyungie.WildWatch.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RatingService {

    @Autowired
    private IncidentRatingRepository ratingRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private OfficeAdminService officeAdminService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private RankService rankService;

    @Autowired
    private BadgeService badgeService;

    private static final int MIN_RATINGS_THRESHOLD = 1;

    @Transactional
    public IncidentRatingResponse rateReporter(String incidentId, RatingRequest request) {
        validateRatingRequest(request);
        
        Incident incident = getIncidentWithRating(incidentId);
        if (incident == null) {
            throw new RuntimeException("Incident not found");
        }

        if (!"RESOLVED".equalsIgnoreCase(incident.getStatus())) {
            throw new RuntimeException("Can only rate resolved incidents");
        }

        IncidentRating rating = ratingRepository.findByIncidentId(incident.getId())
                .orElse(new IncidentRating());

        rating.setIncident(incident);
        rating.setReporterHonesty(request.getHonesty());
        rating.setReporterCredibility(request.getCredibility());
        rating.setReporterResponsiveness(request.getResponsiveness());
        rating.setReporterHelpfulness(request.getHelpfulness());
        rating.setReporterFeedback(request.getFeedback());

        // Check if both ratings are present and award points if not already awarded
        if (rating.hasOfficeRated() && !rating.getPointsAwarded()) {
            awardPointsOptimized(rating, incident);
        }

        IncidentRating savedRating = ratingRepository.save(rating);
        return mapToResponse(savedRating);
    }

    @Transactional
    public IncidentRatingResponse rateOffice(String incidentId, RatingRequest request) {
        validateRatingRequest(request);
        
        Incident incident = getIncidentWithRating(incidentId);
        if (incident == null) {
            throw new RuntimeException("Incident not found");
        }

        if (!"RESOLVED".equalsIgnoreCase(incident.getStatus())) {
            throw new RuntimeException("Can only rate resolved incidents");
        }

        IncidentRating rating = ratingRepository.findByIncidentId(incident.getId())
                .orElse(new IncidentRating());

        rating.setIncident(incident);
        rating.setOfficeHonesty(request.getHonesty());
        rating.setOfficeCredibility(request.getCredibility());
        rating.setOfficeResponsiveness(request.getResponsiveness());
        rating.setOfficeHelpfulness(request.getHelpfulness());
        rating.setOfficeFeedback(request.getFeedback());

        // Check if both ratings are present and award points if not already awarded
        if (rating.hasReporterRated() && !rating.getPointsAwarded()) {
            awardPointsOptimized(rating, incident);
        }

        IncidentRating savedRating = ratingRepository.save(rating);
        return mapToResponse(savedRating);
    }

    public IncidentRatingResponse mapToResponse(IncidentRating rating) {
        IncidentRatingResponse.ReporterRating reporterRating = null;
        IncidentRatingResponse.OfficeRating officeRating = null;
        
        if (rating.hasReporterRated()) {
            reporterRating = new IncidentRatingResponse.ReporterRating(
                rating.getReporterHonesty(),
                rating.getReporterCredibility(),
                rating.getReporterResponsiveness(),
                rating.getReporterHelpfulness(),
                rating.getReporterFeedback()
            );
        }
        
        if (rating.hasOfficeRated()) {
            officeRating = new IncidentRatingResponse.OfficeRating(
                rating.getOfficeHonesty(),
                rating.getOfficeCredibility(),
                rating.getOfficeResponsiveness(),
                rating.getOfficeHelpfulness(),
                rating.getOfficeFeedback()
            );
        }
        
        return new IncidentRatingResponse(
            rating.getIncident().getId(),
            reporterRating,
            officeRating,
            rating.getPointsAwarded(),
            rating.getReporterTotalPoints(),
            rating.getOfficeTotalPoints()
        );
    }

    // Removed caching to fix 500 error
    public List<LeaderboardEntry> getTopReporters() {
        try {
            List<Object[]> results = ratingRepository.getTopReporters();
            
            // Debug log
            System.out.println("TopReporters query returned " + results.size() + " results");
            
            return results.stream()
                    .map(row -> {
                        try {
                            Long id = (Long) row[0];
                            String firstName = (String) row[1];
                            String lastName = (String) row[2];
                            int totalIncidents = row[3] != null ? ((Number) row[3]).intValue() : 0;
                            double avgRating = row[4] != null ? ((Number) row[4]).doubleValue() : 0.0;
                            float points = row[5] != null ? ((Number) row[5]).floatValue() : 0.0f;
                            String rankStr = (String) row[6]; // userRank
                            
                            return new LeaderboardEntry(id, firstName, lastName, totalIncidents, avgRating, points, rankStr);
                        } catch (Exception e) {
                            System.err.println("Error mapping reporter row: " + Arrays.toString(row));
                            e.printStackTrace();
                            // Return a default entry to avoid breaking the stream
                            return new LeaderboardEntry(0L, "Unknown", "User", 0, 0.0, 0.0f, "NONE");
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error getting top reporters: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list on error
        }
    }

    @Cacheable(value = "mostActiveReporters", key = "#root.method.name")
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

    // Removed caching to fix 500 error
    public List<LeaderboardEntry> getTopOffices() {
        try {
            List<Object[]> results = ratingRepository.getTopOffices();
            
            // Debug log
            System.out.println("TopOffices query returned " + results.size() + " results");
            
            return results.stream()
                    .map(row -> {
                        try {
                            Long id = (Long) row[0];
                            String officeCode = (String) row[1];
                            int totalIncidents = row[2] != null ? ((Number) row[2]).intValue() : 0;
                            double avgRating = row[3] != null ? ((Number) row[3]).doubleValue() : 0.0;
                            float points = row[4] != null ? ((Number) row[4]).floatValue() : 0.0f;
                            String rankStr = (String) row[5]; // userRank
                            
                            return new LeaderboardEntry(id, officeCode, totalIncidents, avgRating, points, rankStr);
                        } catch (Exception e) {
                            System.err.println("Error mapping office row: " + Arrays.toString(row));
                            e.printStackTrace();
                            // Return a default entry to avoid breaking the stream
                            return new LeaderboardEntry(0L, "Unknown Office", 0, 0.0, 0.0f, "NONE");
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error getting top offices: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list on error
        }
    }

    @Cacheable(value = "mostActiveOffices", key = "#root.method.name")
    public List<LeaderboardEntry> getMostActiveOffices() {
        return ratingRepository.getMostActiveOffices().stream()
                .map(row -> new LeaderboardEntry(
                        null, // No ID for office enum
                        row[0].toString(), // Office enum as string
                        ((Number) row[1]).intValue() // resolvedIncidents
                ))
                .collect(Collectors.toList());
    }

    /**
     * Optimized method to get incident with single query
     */
    private Incident getIncidentWithRating(String incidentId) {
        return incidentRepository.findByTrackingNumber(incidentId)
            .orElseGet(() -> incidentRepository.findById(incidentId).orElse(null));
    }

    /**
     * Optimized points calculation with batch processing
     */
    private void awardPointsOptimized(IncidentRating rating, Incident incident) {
        if (rating.getPointsAwarded()) {
            return; // Already awarded, skip
        }

        rating.setPointsAwarded(true);
        
        // Calculate points once - based on received ratings
        int reporterPoints = rating.getOfficeTotalPoints();  // Reporter gets points based on office's rating of them
        int officePoints = rating.getReporterTotalPoints();  // Office gets points based on reporter's rating of them
        
        // Batch update both users in single transaction
        try {
            User reporter = incident.getSubmittedBy();
            if (reporter != null) {
                reporter.setPoints((reporter.getPoints() != null ? reporter.getPoints() : 0.0f) + reporterPoints);
                userService.save(reporter);
                
                // Update rank based on new points
                rankService.updateUserRank(reporter);
                
                // Log activity for reporter
                activityLogService.logActivity(
                    "POINTS_AWARDED",
                    String.format("You have been awarded %d points for rating incident #%s", 
                        reporterPoints, incident.getTrackingNumber()),
                    incident,
                    reporter
                );
            }
            
            // Award points to office admin
            if (incident.getAssignedOffice() != null) {
                OfficeAdmin officeAdmin = officeAdminService.findByOfficeCode(incident.getAssignedOffice().name()).orElse(null);
                if (officeAdmin != null) {
                    officeAdmin.setPoints((officeAdmin.getPoints() != null ? officeAdmin.getPoints() : 0.0f) + officePoints);
                    officeAdminService.save(officeAdmin);
                    
                    // Update rank based on new points
                    rankService.updateOfficeAdminRank(officeAdmin);
                    
                    // Check and update Rating Champion badge for office admin
                    try {
                        badgeService.checkRatingChampionBadge(officeAdmin.getUser());
                    } catch (Exception e) {
                        System.err.println("Error checking Rating Champion badge: " + e.getMessage());
                    }
                    
                    // Log activity for office admin
                    activityLogService.logActivity(
                        "POINTS_AWARDED",
                        String.format("You have been awarded %d points for rating incident #%s", 
                            officePoints, incident.getTrackingNumber()),
                        incident,
                        officeAdmin.getUser()
                    );
                }
            }
        } catch (Exception e) {
            // Log error but do not fail the transaction
            System.err.println("Failed to award points: " + e.getMessage());
            rating.setPointsAwarded(false); // Reset flag on error
        }
    }

    /**
     * Optimized validation with early returns
     */
    private void validateRatingRequest(RatingRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Rating request cannot be null");
        }
        
        // Use array for cleaner validation
        Integer[] ratings = {request.getHonesty(), request.getCredibility(), 
                           request.getResponsiveness(), request.getHelpfulness()};
        String[] names = {"Honesty", "Credibility", "Responsiveness", "Helpfulness"};
        
        for (int i = 0; i < ratings.length; i++) {
            if (ratings[i] == null || ratings[i] < 1 || ratings[i] > 5) {
                throw new IllegalArgumentException(
                    String.format("%s rating must be between 1 and 5", names[i]));
            }
        }
    }
}
