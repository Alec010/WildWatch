package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "incident_ratings")
public class IncidentRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "incident_id", nullable = false)
    @NotNull
    private Incident incident;

    // Reporter's ratings of office (4 dimensions)
    @Min(1)
    @Max(5)
    @Column(name = "reporter_honesty")
    private Integer reporterHonesty;

    @Min(1)
    @Max(5)
    @Column(name = "reporter_credibility")
    private Integer reporterCredibility;

    @Min(1)
    @Max(5)
    @Column(name = "reporter_responsiveness")
    private Integer reporterResponsiveness;

    @Min(1)
    @Max(5)
    @Column(name = "reporter_helpfulness")
    private Integer reporterHelpfulness;

    @Column(name = "reporter_feedback", columnDefinition = "TEXT")
    private String reporterFeedback;

    // Office's ratings of reporter (4 dimensions)
    @Min(1)
    @Max(5)
    @Column(name = "office_honesty")
    private Integer officeHonesty;

    @Min(1)
    @Max(5)
    @Column(name = "office_credibility")
    private Integer officeCredibility;

    @Min(1)
    @Max(5)
    @Column(name = "office_responsiveness")
    private Integer officeResponsiveness;

    @Min(1)
    @Max(5)
    @Column(name = "office_helpfulness")
    private Integer officeHelpfulness;

    @Column(name = "office_feedback", columnDefinition = "TEXT")
    private String officeFeedback;

    @Column(name = "rating_timestamp")
    private LocalDateTime ratingTimestamp;

    @Column(name = "points_awarded")
    private Boolean pointsAwarded = false;

    public IncidentRating() {
        this.ratingTimestamp = LocalDateTime.now();
        this.pointsAwarded = false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    
    // Reporter rating getters and setters
    public Integer getReporterHonesty() { return reporterHonesty; }
    public void setReporterHonesty(Integer reporterHonesty) { this.reporterHonesty = reporterHonesty; }
    public Integer getReporterCredibility() { return reporterCredibility; }
    public void setReporterCredibility(Integer reporterCredibility) { this.reporterCredibility = reporterCredibility; }
    public Integer getReporterResponsiveness() { return reporterResponsiveness; }
    public void setReporterResponsiveness(Integer reporterResponsiveness) { this.reporterResponsiveness = reporterResponsiveness; }
    public Integer getReporterHelpfulness() { return reporterHelpfulness; }
    public void setReporterHelpfulness(Integer reporterHelpfulness) { this.reporterHelpfulness = reporterHelpfulness; }
    public String getReporterFeedback() { return reporterFeedback; }
    public void setReporterFeedback(String reporterFeedback) { this.reporterFeedback = reporterFeedback; }
    
    // Office rating getters and setters
    public Integer getOfficeHonesty() { return officeHonesty; }
    public void setOfficeHonesty(Integer officeHonesty) { this.officeHonesty = officeHonesty; }
    public Integer getOfficeCredibility() { return officeCredibility; }
    public void setOfficeCredibility(Integer officeCredibility) { this.officeCredibility = officeCredibility; }
    public Integer getOfficeResponsiveness() { return officeResponsiveness; }
    public void setOfficeResponsiveness(Integer officeResponsiveness) { this.officeResponsiveness = officeResponsiveness; }
    public Integer getOfficeHelpfulness() { return officeHelpfulness; }
    public void setOfficeHelpfulness(Integer officeHelpfulness) { this.officeHelpfulness = officeHelpfulness; }
    public String getOfficeFeedback() { return officeFeedback; }
    public void setOfficeFeedback(String officeFeedback) { this.officeFeedback = officeFeedback; }
    
    public LocalDateTime getRatingTimestamp() { return ratingTimestamp; }
    public void setRatingTimestamp(LocalDateTime ratingTimestamp) { this.ratingTimestamp = ratingTimestamp; }
    public Boolean getPointsAwarded() { return pointsAwarded; }
    public void setPointsAwarded(Boolean pointsAwarded) { this.pointsAwarded = pointsAwarded; }
    
    // Helper methods for backward compatibility and calculations
    public Integer getReporterRating() {
        if (reporterHonesty == null || reporterCredibility == null || 
            reporterResponsiveness == null || reporterHelpfulness == null) {
            return null;
        }
        return (reporterHonesty + reporterCredibility + reporterResponsiveness + reporterHelpfulness) / 4;
    }
    
    public Integer getOfficeRating() {
        if (officeHonesty == null || officeCredibility == null || 
            officeResponsiveness == null || officeHelpfulness == null) {
            return null;
        }
        return (officeHonesty + officeCredibility + officeResponsiveness + officeHelpfulness) / 4;
    }
    
    public boolean hasReporterRated() {
        return reporterHonesty != null && reporterCredibility != null && 
               reporterResponsiveness != null && reporterHelpfulness != null;
    }
    
    public boolean hasOfficeRated() {
        return officeHonesty != null && officeCredibility != null && 
               officeResponsiveness != null && officeHelpfulness != null;
    }
    
    public int getReporterTotalPoints() {
        if (!hasReporterRated()) return 0;
        return reporterHonesty + reporterCredibility + reporterResponsiveness + reporterHelpfulness;
    }
    
    public int getOfficeTotalPoints() {
        if (!hasOfficeRated()) return 0;
        return officeHonesty + officeCredibility + officeResponsiveness + officeHelpfulness;
    }
} 