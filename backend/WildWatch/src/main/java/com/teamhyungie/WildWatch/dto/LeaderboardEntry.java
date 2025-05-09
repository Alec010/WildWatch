package com.teamhyungie.WildWatch.dto;

public class LeaderboardEntry {
    private Long id;
    private String name;
    private Integer totalRatings;
    private Double averageRating;
    private Integer points;
    private Integer activeIncidents;
    private Integer resolvedIncidents;

    // Constructor for reporter entries
    public LeaderboardEntry(Long id, String firstName, String lastName, Integer totalRatings, Double averageRating) {
        this.id = id;
        this.name = firstName + " " + lastName;
        this.totalRatings = totalRatings;
        this.averageRating = averageRating;
        this.points = averageRating != null ? (int) Math.round(averageRating * 10) : 0;
    }

    // Constructor for office entries
    public LeaderboardEntry(Long id, String name, Integer totalRatings, Double averageRating) {
        this.id = id;
        this.name = name;
        this.totalRatings = totalRatings;
        this.averageRating = averageRating;
        this.points = averageRating != null ? (int) Math.round(averageRating * 10) : 0;
    }

    // Constructor for active reporters
    public LeaderboardEntry(Long id, String firstName, String lastName, Integer activeIncidents) {
        this.id = id;
        this.name = firstName + " " + lastName;
        this.activeIncidents = activeIncidents;
    }

    // Constructor for active offices
    public LeaderboardEntry(Long id, String name, Integer resolvedIncidents) {
        this.id = id;
        this.name = name;
        this.resolvedIncidents = resolvedIncidents;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getTotalRatings() { return totalRatings; }
    public void setTotalRatings(Integer totalRatings) { this.totalRatings = totalRatings; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public Integer getActiveIncidents() { return activeIncidents; }
    public void setActiveIncidents(Integer activeIncidents) { this.activeIncidents = activeIncidents; }
    public Integer getResolvedIncidents() { return resolvedIncidents; }
    public void setResolvedIncidents(Integer resolvedIncidents) { this.resolvedIncidents = resolvedIncidents; }
} 