package com.teamhyungie.WildWatch.model;

/**
 * Enum representing user rank tiers in the gamification system
 */
public enum UserRank {
    NONE("Unranked", 0),
    BRONZE("Bronze", 100),
    SILVER("Silver", 200),
    GOLD("Gold", 300);

    private final String displayName;
    private final int minPoints;

    UserRank(String displayName, int minPoints) {
        this.displayName = displayName;
        this.minPoints = minPoints;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getMinPoints() {
        return minPoints;
    }

    /**
     * Calculate the appropriate rank based on points
     */
    public static UserRank calculateRank(float points) {
        if (points >= GOLD.minPoints) {
            return GOLD;
        } else if (points >= SILVER.minPoints) {
            return SILVER;
        } else if (points >= BRONZE.minPoints) {
            return BRONZE;
        } else {
            return NONE;
        }
    }

    /**
     * Get the next rank tier
     */
    public UserRank getNextRank() {
        switch (this) {
            case NONE:
                return BRONZE;
            case BRONZE:
                return SILVER;
            case SILVER:
                return GOLD;
            case GOLD:
                return null; // Gold is the highest rank
            default:
                return null;
        }
    }

    /**
     * Get points required to reach the next rank
     */
    public float getPointsToNextRank(float currentPoints) {
        UserRank nextRank = getNextRank();
        if (nextRank == null) {
            return 0; // Already at max rank
        }
        return Math.max(0, nextRank.minPoints - currentPoints);
    }

    /**
     * Get progress percentage to next rank
     */
    public float getProgressPercentage(float currentPoints) {
        UserRank nextRank = getNextRank();
        if (nextRank == null) {
            return 100.0f; // Already at max rank
        }

        float currentRankMin = this.minPoints;
        float nextRankMin = nextRank.minPoints;
        float range = nextRankMin - currentRankMin;
        float progress = currentPoints - currentRankMin;

        return Math.min(100.0f, (progress / range) * 100.0f);
    }
}





