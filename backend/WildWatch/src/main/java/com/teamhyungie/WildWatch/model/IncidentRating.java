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

    @Min(1)
    @Max(5)
    @Column(name = "reporter_rating")
    private Integer reporterRating;

    @Column(name = "reporter_feedback", columnDefinition = "TEXT")
    private String reporterFeedback;

    @Min(1)
    @Max(5)
    @Column(name = "office_rating")
    private Integer officeRating;

    @Column(name = "office_feedback", columnDefinition = "TEXT")
    private String officeFeedback;

    @Column(name = "rating_timestamp")
    private LocalDateTime ratingTimestamp;

    public IncidentRating() {
        this.ratingTimestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public Integer getReporterRating() { return reporterRating; }
    public void setReporterRating(Integer reporterRating) { this.reporterRating = reporterRating; }
    public String getReporterFeedback() { return reporterFeedback; }
    public void setReporterFeedback(String reporterFeedback) { this.reporterFeedback = reporterFeedback; }
    public Integer getOfficeRating() { return officeRating; }
    public void setOfficeRating(Integer officeRating) { this.officeRating = officeRating; }
    public String getOfficeFeedback() { return officeFeedback; }
    public void setOfficeFeedback(String officeFeedback) { this.officeFeedback = officeFeedback; }
    public LocalDateTime getRatingTimestamp() { return ratingTimestamp; }
    public void setRatingTimestamp(LocalDateTime ratingTimestamp) { this.ratingTimestamp = ratingTimestamp; }
} 