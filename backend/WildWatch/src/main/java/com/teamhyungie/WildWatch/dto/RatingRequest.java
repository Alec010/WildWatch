package com.teamhyungie.WildWatch.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class RatingRequest {
    @NotNull(message = "Honesty rating is required")
    @Min(value = 1, message = "Honesty rating must be at least 1")
    @Max(value = 5, message = "Honesty rating must be at most 5")
    private Integer honesty;

    @NotNull(message = "Credibility rating is required")
    @Min(value = 1, message = "Credibility rating must be at least 1")
    @Max(value = 5, message = "Credibility rating must be at most 5")
    private Integer credibility;

    @NotNull(message = "Responsiveness rating is required")
    @Min(value = 1, message = "Responsiveness rating must be at least 1")
    @Max(value = 5, message = "Responsiveness rating must be at most 5")
    private Integer responsiveness;

    @NotNull(message = "Helpfulness rating is required")
    @Min(value = 1, message = "Helpfulness rating must be at least 1")
    @Max(value = 5, message = "Helpfulness rating must be at most 5")
    private Integer helpfulness;

    private String feedback;

    // Getters and Setters
    public Integer getHonesty() {
        return honesty;
    }

    public void setHonesty(Integer honesty) {
        this.honesty = honesty;
    }

    public Integer getCredibility() {
        return credibility;
    }

    public void setCredibility(Integer credibility) {
        this.credibility = credibility;
    }

    public Integer getResponsiveness() {
        return responsiveness;
    }

    public void setResponsiveness(Integer responsiveness) {
        this.responsiveness = responsiveness;
    }

    public Integer getHelpfulness() {
        return helpfulness;
    }

    public void setHelpfulness(Integer helpfulness) {
        this.helpfulness = helpfulness;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    // Helper methods
    public int getTotalPoints() {
        return (honesty != null ? honesty : 0) + 
               (credibility != null ? credibility : 0) + 
               (responsiveness != null ? responsiveness : 0) + 
               (helpfulness != null ? helpfulness : 0);
    }

    public double getAverageRating() {
        int count = 0;
        int sum = 0;
        if (honesty != null) { sum += honesty; count++; }
        if (credibility != null) { sum += credibility; count++; }
        if (responsiveness != null) { sum += responsiveness; count++; }
        if (helpfulness != null) { sum += helpfulness; count++; }
        return count > 0 ? (double) sum / count : 0.0;
    }

    // Backward compatibility method
    @Deprecated
    public Integer getRating() {
        return (int) Math.round(getAverageRating());
    }

    @Deprecated
    public void setRating(Integer rating) {
        // For backward compatibility, set all dimensions to the same value
        this.honesty = rating;
        this.credibility = rating;
        this.responsiveness = rating;
        this.helpfulness = rating;
    }
} 