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

    @Autowired
    private UserService userService;

    @Autowired
    private OfficeAdminService officeAdminService;

    @Autowired
    private ActivityLogService activityLogService;

    private static final int MIN_RATINGS_THRESHOLD = 1;

    @Transactional
    public IncidentRatingResponse rateReporter(String incidentId, RatingRequest request) {
        // Try by tracking number first, then by ID
        Incident incident = incidentRepository.findByTrackingNumber(incidentId)
            .orElseGet(() -> incidentRepository.findById(incidentId).orElse(null));
        if (incident == null) {
            throw new RuntimeException("Incident not found");
        }

        if (!"RESOLVED".equalsIgnoreCase(incident.getStatus())) {
            throw new RuntimeException("Can only rate resolved incidents");
        }

        IncidentRating rating = ratingRepository.findByIncidentId(incident.getId())
                .orElse(new IncidentRating());

        rating.setIncident(incident);
        rating.setReporterRating(request.getRating());
        rating.setReporterFeedback(request.getFeedback());

        // Check if both ratings are present and award points if not already awarded
        if (rating.getOfficeRating() != null && !rating.getPointsAwarded()) {
            rating.setPointsAwarded(true);
            // Award points to reporter (user)
            try {
                User reporter = incident.getSubmittedBy();
                int reporterPoints = (rating.getOfficeRating() != null ? rating.getOfficeRating() : 0) * 10;
                reporter.setPoints((reporter.getPoints() != null ? reporter.getPoints() : 0) + reporterPoints);
                userService.save(reporter);
                // Log activity for reporter
                activityLogService.logActivity(
                    "POINTS_AWARDED",
                    "You have been awarded " + reporterPoints + " points for rating incident #" + incident.getTrackingNumber(),
                    incident,
                    reporter
                );
            } catch (Exception e) {
                // Log error but do not fail the transaction
                System.err.println("Failed to award points to reporter: " + e.getMessage());
            }
            // Award points to office admin
            try {
                if (incident.getAssignedOffice() != null) {
                    OfficeAdmin officeAdmin = officeAdminService.findByOfficeCode(incident.getAssignedOffice().name()).orElse(null);
                    if (officeAdmin != null) {
                        int officePoints = (rating.getReporterRating() != null ? rating.getReporterRating() : 0) * 10;
                        officeAdmin.setPoints((officeAdmin.getPoints() != null ? officeAdmin.getPoints() : 0) + officePoints);
                        officeAdminService.save(officeAdmin);
                        // Log activity for office admin
                        activityLogService.logActivity(
                            "POINTS_AWARDED",
                            "You have been awarded " + officePoints + " points for rating incident #" + incident.getTrackingNumber(),
                            incident,
                            officeAdmin.getUser()
                        );
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to award points to office admin: " + e.getMessage());
            }
        }

        IncidentRating savedRating = ratingRepository.save(rating);
        return mapToResponse(savedRating);
    }

    @Transactional
    public IncidentRatingResponse rateOffice(String incidentId, RatingRequest request) {
        // Try by tracking number first, then by ID
        Incident incident = incidentRepository.findByTrackingNumber(incidentId)
            .orElseGet(() -> incidentRepository.findById(incidentId).orElse(null));
        if (incident == null) {
            throw new RuntimeException("Incident not found");
        }

        if (!"RESOLVED".equalsIgnoreCase(incident.getStatus())) {
            throw new RuntimeException("Can only rate resolved incidents");
        }

        IncidentRating rating = ratingRepository.findByIncidentId(incident.getId())
                .orElse(new IncidentRating());

        rating.setIncident(incident);
        rating.setOfficeRating(request.getRating());
        rating.setOfficeFeedback(request.getFeedback());

        // Check if both ratings are present and award points if not already awarded
        if (rating.getReporterRating() != null && !rating.getPointsAwarded()) {
            rating.setPointsAwarded(true);
            // Award points to reporter (user)
            try {
                User reporter = incident.getSubmittedBy();
                int reporterPoints = (rating.getOfficeRating() != null ? rating.getOfficeRating() : 0) * 10;
                reporter.setPoints((reporter.getPoints() != null ? reporter.getPoints() : 0) + reporterPoints);
                userService.save(reporter);
                // Log activity for reporter
                activityLogService.logActivity(
                    "POINTS_AWARDED",
                    "You have been awarded " + reporterPoints + " points for rating incident #" + incident.getTrackingNumber(),
                    incident,
                    reporter
                );
            } catch (Exception e) {
                System.err.println("Failed to award points to reporter: " + e.getMessage());
            }
            // Award points to office admin
            try {
                if (incident.getAssignedOffice() != null) {
                    OfficeAdmin officeAdmin = officeAdminService.findByOfficeCode(incident.getAssignedOffice().name()).orElse(null);
                    if (officeAdmin != null) {
                        int officePoints = (rating.getReporterRating() != null ? rating.getReporterRating() : 0) * 10;
                        officeAdmin.setPoints((officeAdmin.getPoints() != null ? officeAdmin.getPoints() : 0) + officePoints);
                        officeAdminService.save(officeAdmin);
                        // Log activity for office admin
                        activityLogService.logActivity(
                            "POINTS_AWARDED",
                            "You have been awarded " + officePoints + " points for rating incident #" + incident.getTrackingNumber(),
                            incident,
                            officeAdmin.getUser()
                        );
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to award points to office admin: " + e.getMessage());
            }
        }

        IncidentRating savedRating = ratingRepository.save(rating);
        return mapToResponse(savedRating);
    }

    public IncidentRatingResponse mapToResponse(IncidentRating rating) {
        return new IncidentRatingResponse(
            rating.getIncident().getId(),
            rating.getReporterRating(),
            rating.getReporterFeedback(),
            rating.getOfficeRating(),
            rating.getOfficeFeedback(),
            rating.getPointsAwarded()
        );
    }

    public List<LeaderboardEntry> getTopReporters() {
        return ratingRepository.getTopReporters().stream()
                .map(row -> new LeaderboardEntry(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).intValue(),  // totalIncidents
                        ((Number) row[4]).doubleValue(),  // avgRating (1-5 scale)
                        ((Number) row[5]).intValue()  // points
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
        return ratingRepository.getTopOffices().stream()
                .map(row -> new LeaderboardEntry(
                        (Long) row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue(),  // totalIncidents
                        ((Number) row[3]).doubleValue(),  // avgRating (1-5 scale)
                        ((Number) row[4]).intValue()  // points
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