package com.teamhyungie.WildWatch.dto;

public class LeaderboardEntry {
    private Long id;
    private String name;
    private Integer totalIncidents;
    private Double averageRating;
    private Float points;
    private Integer activeIncidents;
    private Integer resolvedIncidents;

    // Constructor for reporter entries
    public LeaderboardEntry(Long id, String firstName, String lastName, Integer totalIncidents, Double averageRating, Float points) {
        this.id = id;
        this.name = firstName + " " + lastName;
        this.totalIncidents = totalIncidents;
        this.averageRating = averageRating;
        this.points = points;
    }

    // Constructor for office entries
    public LeaderboardEntry(Long id, String name, Integer totalIncidents, Double averageRating, Float points) {
        this.id = id;
        this.name = name;
        this.totalIncidents = totalIncidents;
        this.averageRating = averageRating;
        this.points = points;
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
    public Integer getTotalIncidents() { return totalIncidents; }
    public void setTotalIncidents(Integer totalIncidents) { this.totalIncidents = totalIncidents; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    public Float getPoints() { return points; }
    public void setPoints(Float points) { this.points = points; }
    public Integer getActiveIncidents() { return activeIncidents; }
    public void setActiveIncidents(Integer activeIncidents) { this.activeIncidents = activeIncidents; }
    public Integer getResolvedIncidents() { return resolvedIncidents; }
    public void setResolvedIncidents(Integer resolvedIncidents) { this.resolvedIncidents = resolvedIncidents; }
} 