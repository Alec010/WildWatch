package com.teamhyungie.WildWatch.dto;

/**
 * DTO for Gold Elite leaderboard entries (Top 10 users with 300+ points)
 */
public class GoldLeaderboardEntry {
    private Long id;
    private String name;
    private Float points;
    private Integer goldRanking; // 1-10
    private Double averageRating;
    private Integer totalIncidents;

    public GoldLeaderboardEntry() {
    }

    public GoldLeaderboardEntry(Long id, String name, Float points, Integer goldRanking, 
                               Double averageRating, Integer totalIncidents) {
        this.id = id;
        this.name = name;
        this.points = points;
        this.goldRanking = goldRanking;
        this.averageRating = averageRating;
        this.totalIncidents = totalIncidents;
    }

    // Constructor for building from query results with firstName and lastName
    public GoldLeaderboardEntry(Long id, String firstName, String lastName, Float points, 
                               Double averageRating, Integer totalIncidents) {
        this.id = id;
        this.name = firstName + " " + lastName;
        this.points = points;
        this.averageRating = averageRating;
        this.totalIncidents = totalIncidents;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Float getPoints() {
        return points;
    }

    public void setPoints(Float points) {
        this.points = points;
    }

    public Integer getGoldRanking() {
        return goldRanking;
    }

    public void setGoldRanking(Integer goldRanking) {
        this.goldRanking = goldRanking;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalIncidents() {
        return totalIncidents;
    }

    public void setTotalIncidents(Integer totalIncidents) {
        this.totalIncidents = totalIncidents;
    }
}








