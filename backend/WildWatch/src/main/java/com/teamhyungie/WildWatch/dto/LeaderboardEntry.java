package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.UserRank;

public class LeaderboardEntry {
    private Long id;
    private String name;
    private Integer totalIncidents;
    private Double averageRating;
    private Float points;
    private Integer activeIncidents;
    private Integer resolvedIncidents;
    private UserRank rank;
    private Integer goldRanking; // For Gold Elite users (1-10)

    // Constructor for reporter entries (with rank)
    public LeaderboardEntry(Long id, String firstName, String lastName, Integer totalIncidents, Double averageRating, Float points, String rankStr) {
        this.id = id;
        this.name = firstName + " " + lastName;
        this.totalIncidents = totalIncidents;
        this.averageRating = averageRating;
        this.points = points;
        this.rank = rankStr != null ? UserRank.valueOf(rankStr) : UserRank.NONE;
    }

    // Constructor for office entries (with rank)
    public LeaderboardEntry(Long id, String name, Integer totalIncidents, Double averageRating, Float points, String rankStr) {
        this.id = id;
        this.name = name;
        this.totalIncidents = totalIncidents;
        this.averageRating = averageRating;
        this.points = points;
        this.rank = rankStr != null ? UserRank.valueOf(rankStr) : UserRank.NONE;
    }

    // Legacy constructor for reporter entries (without rank)
    public LeaderboardEntry(Long id, String firstName, String lastName, Integer totalIncidents, Double averageRating, Float points) {
        this(id, firstName, lastName, totalIncidents, averageRating, points, "NONE");
    }

    // Legacy constructor for office entries (without rank)
    public LeaderboardEntry(Long id, String name, Integer totalIncidents, Double averageRating, Float points) {
        this.id = id;
        this.name = name;
        this.totalIncidents = totalIncidents;
        this.averageRating = averageRating;
        this.points = points;
        this.rank = UserRank.NONE;
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
    public UserRank getRank() { return rank; }
    public void setRank(UserRank rank) { this.rank = rank; }
    public Integer getGoldRanking() { return goldRanking; }
    public void setGoldRanking(Integer goldRanking) { this.goldRanking = goldRanking; }
} 