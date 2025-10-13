package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.BadgeLevelDTO;
import com.teamhyungie.WildWatch.dto.BadgeProgressDTO;
import com.teamhyungie.WildWatch.dto.UserBadgeSummaryDTO;
import com.teamhyungie.WildWatch.model.*;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.repository.BadgeLevelRepository;
import com.teamhyungie.WildWatch.repository.BadgeRepository;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import com.teamhyungie.WildWatch.repository.UserBadgeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing user badges
 */
@Service
public class BadgeService {

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private BadgeLevelRepository badgeLevelRepository;

    @Autowired
    private UserBadgeRepository userBadgeRepository;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private UserService userService;
    
    @Autowired
    private IncidentRepository incidentRepository;

    /**
     * Initialize the badge system with the default badges
     * This should be called on application startup
     */
    @Transactional
    public void initializeDefaultBadges() {
        // First Responder Badge
        createOrUpdateBadge(
            Badge.BadgeType.FIRST_RESPONDER,
            "First Responder",
            "Submit your very first incident report",
            "/images/badges/first-responder.png",
            10,
            3,
            List.of(
                new String[]{"1", "Submit 1 incident report", "1"},
                new String[]{"2", "Submit 3 incident reports", "3"},
                new String[]{"3", "Submit 5 incident reports", "5"}
            )
        );

        // Community Helper Badge
        createOrUpdateBadge(
            Badge.BadgeType.COMMUNITY_HELPER,
            "Community Helper",
            "Receive upvotes on your incident reports",
            "/images/badges/community-helper.png",
            75,
            3,
            List.of(
                new String[]{"1", "Receive 25 upvotes", "25"},
                new String[]{"2", "Receive 50 upvotes", "50"},
                new String[]{"3", "Receive 100 upvotes", "100"}
            )
        );

        // Campus Legend Badge
        createOrUpdateBadge(
            Badge.BadgeType.CAMPUS_LEGEND,
            "Campus Legend",
            "Achieve and maintain Gold rank",
            "/images/badges/campus-legend.png",
            150,
            3,
            List.of(
                new String[]{"1", "Achieve Bronze rank (100 points)", "100"},
                new String[]{"2", "Achieve Silver rank (200 points)", "200"},
                new String[]{"3", "Achieve Gold rank (300 points)", "300"}
            )
        );

        // Office Admin Badges
        // First Response Badge
        createOrUpdateBadge(
            Badge.BadgeType.FIRST_RESPONSE,
            "First Response",
            "Resolve incident reports",
            "/images/badges/first-response.png",
            15,
            3,
            List.of(
                new String[]{"1", "Resolve 1 incident report", "1"},
                new String[]{"2", "Resolve 10 incident reports", "10"},
                new String[]{"3", "Resolve 25 incident reports", "25"}
            )
        );

        // Rating Champion Badge
        createOrUpdateBadge(
            Badge.BadgeType.RATING_CHAMPION,
            "Rating Champion",
            "Receive high ratings from students",
            "/images/badges/rating-champion.png",
            100,
            3,
            List.of(
                new String[]{"1", "Receive 20-star rating on 10 incidents", "10"},
                new String[]{"2", "Receive 20-star rating on 25 incidents", "25"},
                new String[]{"3", "Receive 20-star rating on 50 incidents", "50"}
            )
        );

        // Office Legend Badge
        createOrUpdateBadge(
            Badge.BadgeType.OFFICE_LEGEND,
            "Office Legend",
            "Achieve and maintain Gold rank",
            "/images/badges/office-legend.png",
            200,
            3,
            List.of(
                new String[]{"1", "Achieve Bronze rank (100 points)", "100"},
                new String[]{"2", "Achieve Silver rank (200 points)", "200"},
                new String[]{"3", "Achieve Gold rank (300 points)", "300"}
            )
        );
    }

    /**
     * Helper method to create or update a badge
     */
    private void createOrUpdateBadge(Badge.BadgeType badgeType, String name, String description, 
                                   String iconUrl, Integer pointReward, Integer maxLevel,
                                   List<String[]> levelDetails) {
        
        Badge badge = badgeRepository.findByBadgeType(badgeType)
            .orElse(new Badge(null, name, description, iconUrl, pointReward, badgeType, maxLevel));
        
        if (badge.getId() == null) {
            badge.setName(name);
            badge.setDescription(description);
            badge.setIconUrl(iconUrl);
            badge.setPointReward(pointReward);
            badge.setMaxLevel(maxLevel);
            badge = badgeRepository.save(badge);
        }
        
        // Create or update badge levels
        for (String[] levelDetail : levelDetails) {
            Integer level = Integer.parseInt(levelDetail[0]);
            String levelDescription = levelDetail[1];
            Integer requirement = Integer.parseInt(levelDetail[2]);
            
            BadgeLevel badgeLevel = badgeLevelRepository.findByBadgeAndLevel(badge, level)
                .orElse(new BadgeLevel(null, badge, level, requirement, levelDescription));
            
            if (badgeLevel.getId() == null) {
                badgeLevel.setDescription(levelDescription);
                badgeLevel.setRequirement(requirement);
                badgeLevelRepository.save(badgeLevel);
            }
        }
    }

    /**
     * Check and update all badges for a user
     * This is the main entry point for badge evaluation
     */
    @Transactional
    public void checkAndUpdateBadges(User user) {
        if (user == null) return;
        
        // Check regular user badges
        checkFirstResponderBadge(user);
        checkCommunityHelperBadge(user);
        checkCampusLegendBadge(user);
        
        // Check office admin badges if user is office admin
        if (user.getRole() != null && user.getRole().name().equals("OFFICE_ADMIN")) {
            checkFirstResponseBadge(user);
            checkRatingChampionBadge(user);
            checkOfficeLegendBadge(user);
        }
    }

    /**
     * Check and update First Responder badge
     * Triggered when a user submits a report
     */
    @Transactional
    public void checkFirstResponderBadge(User user) {
        Badge badge = badgeRepository.findByBadgeType(Badge.BadgeType.FIRST_RESPONDER)
            .orElseThrow(() -> new RuntimeException("First Responder badge not found"));
        
        // Get user's total incident count
        List<Incident> userIncidents = incidentRepository.findBySubmittedByOrderBySubmittedAtDesc(user);
        Integer totalIncidents = userIncidents != null ? userIncidents.size() : 0;
        
        updateBadgeProgress(user, badge, totalIncidents);
    }

    /**
     * Check and update Community Helper badge
     * Triggered when a user receives an upvote
     */
    @Transactional
    public void checkCommunityHelperBadge(User user) {
        Badge badge = badgeRepository.findByBadgeType(Badge.BadgeType.COMMUNITY_HELPER)
            .orElseThrow(() -> new RuntimeException("Community Helper badge not found"));
        
        // Get user's total upvote count
        Integer totalUpvotes = incidentRepository.countTotalUpvotesByUser(user);
        if (totalUpvotes == null) {
            totalUpvotes = 0;
        }
        
        updateBadgeProgress(user, badge, totalUpvotes);
    }

    /**
     * Check and update Campus Legend badge
     * Triggered when a user's rank changes
     */
    @Transactional
    public void checkCampusLegendBadge(User user) {
        Badge badge = badgeRepository.findByBadgeType(Badge.BadgeType.CAMPUS_LEGEND)
            .orElseThrow(() -> new RuntimeException("Campus Legend badge not found"));
        
        // Get user's current points
        Float points = user.getPoints();
        if (points == null) points = 0f;
        
        updateBadgeProgress(user, badge, Math.round(points));
    }

    // Office Admin Badge Methods

    /**
     * Check and update First Response badge
     * Triggered when an office admin resolves an incident
     */
    @Transactional
    public void checkFirstResponseBadge(User user) {
        Badge badge = badgeRepository.findByBadgeType(Badge.BadgeType.FIRST_RESPONSE)
            .orElseThrow(() -> new RuntimeException("First Response badge not found"));
        
        // Get user's total resolved incidents count
        Integer totalResolved = incidentRepository.countResolvedIncidentsByOfficeAdmin(user);
        if (totalResolved == null) {
            totalResolved = 0;
        }
        
        updateBadgeProgress(user, badge, totalResolved);
    }

    /**
     * Check and update Rating Champion badge
     * Triggered when an office admin receives a high rating
     */
    @Transactional
    public void checkRatingChampionBadge(User user) {
        Badge badge = badgeRepository.findByBadgeType(Badge.BadgeType.RATING_CHAMPION)
            .orElseThrow(() -> new RuntimeException("Rating Champion badge not found"));
        
        // Get user's total incidents with 20-star ratings
        Integer totalHighRatings = incidentRepository.countHighRatedIncidentsByOfficeAdmin(user, 20);
        if (totalHighRatings == null) {
            totalHighRatings = 0;
        }
        
        updateBadgeProgress(user, badge, totalHighRatings);
    }

    /**
     * Check and update Office Legend badge
     * Triggered when an office admin's rank changes
     */
    @Transactional
    public void checkOfficeLegendBadge(User user) {
        Badge badge = badgeRepository.findByBadgeType(Badge.BadgeType.OFFICE_LEGEND)
            .orElseThrow(() -> new RuntimeException("Office Legend badge not found"));
        
        // Get user's current points
        Float points = user.getPoints();
        if (points == null) points = 0f;
        
        updateBadgeProgress(user, badge, Math.round(points));
    }

    /**
     * Update badge progress and award levels if requirements are met
     */
    @Transactional
    private void updateBadgeProgress(User user, Badge badge, Integer currentProgress) {
        // Get or create user badge
        UserBadge userBadge = userBadgeRepository.findByUserAndBadge(user, badge)
            .orElse(new UserBadge(null, user, badge, 0, 0, null, null, null, false, false));
        
        // Update progress
        userBadge.setCurrentProgress(currentProgress);
        
        // Get badge levels
        List<BadgeLevel> levels = badgeLevelRepository.findByBadgeOrderByLevelAsc(badge);
        
        // Check each level
        for (BadgeLevel level : levels) {
            if (currentProgress >= level.getRequirement() && userBadge.getCurrentLevel() < level.getLevel()) {
                // Award this level
                awardBadgeLevel(user, userBadge, level.getLevel());
            }
        }
        
        // Save user badge
        if (userBadge.getId() == null) {
            userBadgeRepository.save(userBadge);
        }
    }

    /**
     * Award a badge level to a user
     */
    @Transactional
    private void awardBadgeLevel(User user, UserBadge userBadge, Integer level) {
        // Update user badge
        userBadge.setCurrentLevel(level);
        userBadge.setAwardedDateForLevel(level, LocalDateTime.now());
        userBadge.setIsNotified(false);
        userBadgeRepository.save(userBadge);
        
        // Don't automatically award points - user must claim the badge manually
        
        // Create notification
        String message;
        if (level == 3) {
            // Full badge completion - ready to claim
            message = String.format(
                "🏆 You've completed the %s badge! All 3 stars earned! Click to claim your +%d points!",
                userBadge.getBadge().getName(),
                userBadge.getBadge().getPointReward()
            );
        } else {
            // Star progression
            message = String.format(
                "⭐ You've earned star %d of the %s badge! (%d/%d stars)",
                level,
                userBadge.getBadge().getName(),
                level,
                userBadge.getBadge().getMaxLevel()
            );
        }
        
        activityLogService.logActivity(
            "BADGE_EARNED",
            message,
            null,
            user
        );
    }

    /**
     * Get all badges with progress for a user
     */
    public List<BadgeProgressDTO> getUserBadges(User user) {
        List<Badge> allBadges = badgeRepository.findAllByOrderByBadgeTypeAsc();
        List<UserBadge> userBadges = userBadgeRepository.findByUser(user);
        
        return allBadges.stream().map(badge -> {
            // Find user's progress for this badge
            Optional<UserBadge> userBadgeOpt = userBadges.stream()
                .filter(ub -> ub.getBadge().getId().equals(badge.getId()))
                .findFirst();
            
            UserBadge userBadge = userBadgeOpt.orElse(
                new UserBadge(null, user, badge, 0, 0, null, null, null, false, false)
            );
            
            // Get badge levels
            List<BadgeLevel> badgeLevels = badgeLevelRepository.findByBadgeOrderByLevelAsc(badge);
            
            // Map badge levels to DTOs - stars light up progressively
            List<BadgeLevelDTO> levelDTOs = badgeLevels.stream().map(level -> {
                // A star is achieved if the user has reached this level or higher
                boolean achieved = userBadge.getCurrentLevel() >= level.getLevel();
                return new BadgeLevelDTO(
                    level.getLevel(),
                    level.getDescription(),
                    level.getRequirement(),
                    achieved,
                    achieved ? userBadge.getAwardedDateForLevel(level.getLevel()) : null
                );
            }).collect(Collectors.toList());
            
            // Calculate next level requirement and progress percentage
            Integer nextLevelRequirement = 0;
            Float progressPercentage = 0f;
            
            if (userBadge.getCurrentLevel() < badge.getMaxLevel()) {
                // Find the next star level to achieve
                Optional<BadgeLevel> nextLevel = badgeLevels.stream()
                    .filter(level -> level.getLevel() == userBadge.getCurrentLevel() + 1)
                    .findFirst();
                
                if (nextLevel.isPresent()) {
                    nextLevelRequirement = nextLevel.get().getRequirement();
                    
                    // Calculate previous level requirement (current achieved level)
                    Integer prevLevelRequirement = 0;
                    if (userBadge.getCurrentLevel() > 0) {
                        Optional<BadgeLevel> currentLevel = badgeLevels.stream()
                            .filter(level -> level.getLevel() == userBadge.getCurrentLevel())
                            .findFirst();
                        
                        if (currentLevel.isPresent()) {
                            prevLevelRequirement = currentLevel.get().getRequirement();
                        }
                    }
                    
                    // Calculate progress percentage towards next star
                    Integer progressRange = nextLevelRequirement - prevLevelRequirement;
                    Integer userProgress = userBadge.getCurrentProgress() - prevLevelRequirement;
                    
                    if (progressRange > 0) {
                        progressPercentage = (userProgress.floatValue() / progressRange) * 100;
                        progressPercentage = Math.min(100f, Math.max(0f, progressPercentage));
                    }
                }
            } else {
                // All stars completed
                progressPercentage = 100f;
                nextLevelRequirement = badgeLevels.stream()
                    .filter(level -> level.getLevel() == badge.getMaxLevel())
                    .findFirst()
                    .map(BadgeLevel::getRequirement)
                    .orElse(0);
            }
            
            // Determine if badge is completed and if points have been awarded
            boolean isCompleted = userBadge.getCurrentLevel() >= badge.getMaxLevel();
            boolean pointsAwarded = userBadge.getPointsAwarded() != null ? userBadge.getPointsAwarded() : false;
            
            // Generate dynamic description based on current progress
            String dynamicDescription = generateDynamicDescription(badge, userBadge, badgeLevels);
            
            // Create badge progress DTO
            return new BadgeProgressDTO(
                badge.getId(),
                badge.getName(),
                dynamicDescription,
                badge.getIconUrl(),
                badge.getPointReward(),
                badge.getBadgeType(),
                userBadge.getCurrentLevel(),
                userBadge.getCurrentProgress(),
                nextLevelRequirement,
                progressPercentage,
                levelDTOs,
                isCompleted,
                pointsAwarded
            );
        }).collect(Collectors.toList());
    }

    /**
     * Generate dynamic description based on user's current progress
     */
    private String generateDynamicDescription(Badge badge, UserBadge userBadge, List<BadgeLevel> badgeLevels) {
        int currentLevel = userBadge.getCurrentLevel();
        
        // If badge is completed, show completion message
        if (currentLevel >= badge.getMaxLevel()) {
            return "Badge completed! All stars earned!";
        }
        
        // Find the next level to achieve
        Optional<BadgeLevel> nextLevel = badgeLevels.stream()
            .filter(level -> level.getLevel() == currentLevel + 1)
            .findFirst();
        
        if (nextLevel.isPresent()) {
            BadgeLevel level = nextLevel.get();
            
            // Generate specific description based on badge type and level
            switch (badge.getBadgeType()) {
                case FIRST_RESPONDER:
                    return String.format("Submit %d incident report%s", 
                        level.getRequirement(), 
                        level.getRequirement() == 1 ? "" : "s");
                        
                case COMMUNITY_HELPER:
                    return String.format("Receive %d upvote%s", 
                        level.getRequirement(), 
                        level.getRequirement() == 1 ? "" : "s");
                        
                case CAMPUS_LEGEND:
                    String rankName = getRankName(level.getRequirement());
                    return String.format("Achieve %s rank (%d points)", rankName, level.getRequirement());
                    
                default:
                    return level.getDescription();
            }
        }
        
        // Fallback to original description
        return badge.getDescription();
    }
    
    /**
     * Get rank name based on points requirement
     */
    private String getRankName(int points) {
        if (points >= 300) return "Gold";
        if (points >= 200) return "Silver";
        if (points >= 100) return "Bronze";
        return "Bronze";
    }

    /**
     * Get badge summary for a user
     */
    public UserBadgeSummaryDTO getUserBadgeSummary(User user) {
        List<BadgeProgressDTO> badges = getUserBadges(user);
        
        Integer totalBadgesEarned = userBadgeRepository.getEarnedBadgesCount(user);
        Integer totalBadgesAvailable = Math.toIntExact(badgeRepository.count());
        Integer totalPointsEarned = userBadgeRepository.getTotalBadgePoints(user);
        
        if (totalPointsEarned == null) totalPointsEarned = 0;
        
        return new UserBadgeSummaryDTO(
            totalBadgesEarned,
            totalBadgesAvailable,
            totalPointsEarned,
            badges
        );
    }

    /**
     * Process unnotified badges and mark them as notified
     * This should be called after fetching badges to avoid duplicate notifications
     */
    @Transactional
    public void processUnnotifiedBadges(User user) {
        List<UserBadge> unnotifiedBadges = userBadgeRepository.findByUser(user).stream()
            .filter(ub -> !ub.getIsNotified() && ub.getCurrentLevel() > 0)
            .collect(Collectors.toList());
        
        for (UserBadge badge : unnotifiedBadges) {
            badge.setIsNotified(true);
        }
        
        if (!unnotifiedBadges.isEmpty()) {
            userBadgeRepository.saveAll(unnotifiedBadges);
        }
    }

    /**
     * Claim a badge and award points (only when all 3 stars are completed)
     */
    @Transactional
    public void claimBadge(User user, Long badgeId) {
        Badge badge = badgeRepository.findById(badgeId)
            .orElseThrow(() -> new RuntimeException("Badge not found"));
        
        UserBadge userBadge = userBadgeRepository.findByUserAndBadge(user, badge)
            .orElseThrow(() -> new RuntimeException("User badge not found"));
        
        // Check if badge is completed (all 3 stars earned)
        if (userBadge.getCurrentLevel() < badge.getMaxLevel()) {
            throw new RuntimeException("Badge is not completed yet. All 3 stars must be earned first.");
        }
        
        // Check if already claimed
        if (userBadge.getPointsAwarded()) {
            throw new RuntimeException("Badge has already been claimed.");
        }
        
        // Award points
        if (badge.getPointReward() != null) {
            Float currentPoints = user.getPoints();
            if (currentPoints == null) currentPoints = 0f;
            user.setPoints(currentPoints + badge.getPointReward());
            userService.save(user);
        }
        
        // Mark as claimed
        userBadge.setPointsAwarded(true);
        userBadgeRepository.save(userBadge);
        
        // Create notification
        String message = String.format(
            "🎉 You've claimed the %s badge! +%d points added to your account!",
            badge.getName(),
            badge.getPointReward()
        );
        
        activityLogService.logActivity(
            "BADGE_CLAIMED",
            message,
            null,
            user
        );
    }
}
