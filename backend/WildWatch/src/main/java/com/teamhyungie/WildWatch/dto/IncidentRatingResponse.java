package com.teamhyungie.WildWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidentRatingResponse {
    private String incidentId;
    private ReporterRating reporterRating;
    private OfficeRating officeRating;
    private Boolean pointsAwarded;
    private Integer totalReporterPoints;
    private Integer totalOfficePoints;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReporterRating {
        private Integer honesty;
        private Integer credibility;
        private Integer responsiveness;
        private Integer helpfulness;
        private String feedback;
        private Integer totalPoints;
        private Double averageRating;

        public ReporterRating(Integer honesty, Integer credibility, Integer responsiveness, 
                            Integer helpfulness, String feedback) {
            this.honesty = honesty;
            this.credibility = credibility;
            this.responsiveness = responsiveness;
            this.helpfulness = helpfulness;
            this.feedback = feedback;
            this.totalPoints = calculateTotalPoints();
            this.averageRating = calculateAverageRating();
        }

        private Integer calculateTotalPoints() {
            return (honesty != null ? honesty : 0) + 
                   (credibility != null ? credibility : 0) + 
                   (responsiveness != null ? responsiveness : 0) + 
                   (helpfulness != null ? helpfulness : 0);
        }

        private Double calculateAverageRating() {
            int count = 0;
            int sum = 0;
            if (honesty != null) { sum += honesty; count++; }
            if (credibility != null) { sum += credibility; count++; }
            if (responsiveness != null) { sum += responsiveness; count++; }
            if (helpfulness != null) { sum += helpfulness; count++; }
            return count > 0 ? (double) sum / count : null;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfficeRating {
        private Integer honesty;
        private Integer credibility;
        private Integer responsiveness;
        private Integer helpfulness;
        private String feedback;
        private Integer totalPoints;
        private Double averageRating;

        public OfficeRating(Integer honesty, Integer credibility, Integer responsiveness, 
                          Integer helpfulness, String feedback) {
            this.honesty = honesty;
            this.credibility = credibility;
            this.responsiveness = responsiveness;
            this.helpfulness = helpfulness;
            this.feedback = feedback;
            this.totalPoints = calculateTotalPoints();
            this.averageRating = calculateAverageRating();
        }

        private Integer calculateTotalPoints() {
            return (honesty != null ? honesty : 0) + 
                   (credibility != null ? credibility : 0) + 
                   (responsiveness != null ? responsiveness : 0) + 
                   (helpfulness != null ? helpfulness : 0);
        }

        private Double calculateAverageRating() {
            int count = 0;
            int sum = 0;
            if (honesty != null) { sum += honesty; count++; }
            if (credibility != null) { sum += credibility; count++; }
            if (responsiveness != null) { sum += responsiveness; count++; }
            if (helpfulness != null) { sum += helpfulness; count++; }
            return count > 0 ? (double) sum / count : null;
        }
    }

    // Backward compatibility constructors
    @Deprecated
    public IncidentRatingResponse(String incidentId, Integer reporterRating, String reporterFeedback,
                                Integer officeRating, String officeFeedback, Boolean pointsAwarded) {
        this.incidentId = incidentId;
        this.pointsAwarded = pointsAwarded;
        
        // Convert old format to new format
        if (reporterRating != null) {
            this.reporterRating = new ReporterRating(reporterRating, reporterRating, reporterRating, reporterRating, reporterFeedback);
        }
        if (officeRating != null) {
            this.officeRating = new OfficeRating(officeRating, officeRating, officeRating, officeRating, officeFeedback);
        }
        
        this.totalReporterPoints = this.reporterRating != null ? this.reporterRating.getTotalPoints() : 0;
        this.totalOfficePoints = this.officeRating != null ? this.officeRating.getTotalPoints() : 0;
    }
} 