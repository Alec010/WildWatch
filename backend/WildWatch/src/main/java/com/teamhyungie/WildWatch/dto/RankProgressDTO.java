package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.UserRank;

/**
 * DTO containing user's rank progress information
 */
public class RankProgressDTO {
    private UserRank currentRank;
    private Float currentPoints;
    private UserRank nextRank;
    private Float pointsToNextRank;
    private Float progressPercentage;
    private Integer goldRanking; // 1-10 for Gold Elite, null otherwise
    private String rankDisplayName;

    public RankProgressDTO() {
    }

    public RankProgressDTO(UserRank currentRank, Float currentPoints, UserRank nextRank, 
                          Float pointsToNextRank, Float progressPercentage, 
                          Integer goldRanking, String rankDisplayName) {
        this.currentRank = currentRank;
        this.currentPoints = currentPoints;
        this.nextRank = nextRank;
        this.pointsToNextRank = pointsToNextRank;
        this.progressPercentage = progressPercentage;
        this.goldRanking = goldRanking;
        this.rankDisplayName = rankDisplayName;
    }

    // Getters and Setters
    public UserRank getCurrentRank() {
        return currentRank;
    }

    public void setCurrentRank(UserRank currentRank) {
        this.currentRank = currentRank;
    }

    public Float getCurrentPoints() {
        return currentPoints;
    }

    public void setCurrentPoints(Float currentPoints) {
        this.currentPoints = currentPoints;
    }

    public UserRank getNextRank() {
        return nextRank;
    }

    public void setNextRank(UserRank nextRank) {
        this.nextRank = nextRank;
    }

    public Float getPointsToNextRank() {
        return pointsToNextRank;
    }

    public void setPointsToNextRank(Float pointsToNextRank) {
        this.pointsToNextRank = pointsToNextRank;
    }

    public Float getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(Float progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public Integer getGoldRanking() {
        return goldRanking;
    }

    public void setGoldRanking(Integer goldRanking) {
        this.goldRanking = goldRanking;
    }

    public String getRankDisplayName() {
        return rankDisplayName;
    }

    public void setRankDisplayName(String rankDisplayName) {
        this.rankDisplayName = rankDisplayName;
    }
}








