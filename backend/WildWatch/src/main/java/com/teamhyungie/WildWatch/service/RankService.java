package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.GoldLeaderboardEntry;
import com.teamhyungie.WildWatch.dto.RankProgressDTO;
import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.UserRank;
import com.teamhyungie.WildWatch.repository.OfficeAdminRepository;
import com.teamhyungie.WildWatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for managing user and office admin rankings
 */
@Service
public class RankService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OfficeAdminRepository officeAdminRepository;

    @Autowired
    private ActivityLogService activityLogService;
    
    @Autowired
    private BadgeService badgeService;

    /**
     * Update user's rank based on current points
     * Automatically checks if rank should change and logs rank-up events
     */
    @Transactional
    public void updateUserRank(User user) {
        if (user == null || user.getPoints() == null) {
            return;
        }

        UserRank oldRank = user.getUserRank();
        if (oldRank == null) {
            oldRank = UserRank.NONE;
        }

        UserRank newRank = UserRank.calculateRank(user.getPoints());

        if (oldRank != newRank) {
            user.setUserRank(newRank);
            userRepository.save(user);

            // Log rank-up event (only if ranking up, not down)
            if (newRank.ordinal() > oldRank.ordinal()) {
                String message = String.format(
                    "🎉 Congratulations! You've been promoted to %s rank!",
                    newRank.getDisplayName()
                );
                activityLogService.logActivity(
                    "RANK_UP",
                    message,
                    null,
                    user
                );
                
                // Check and update Campus Legend badge
                try {
                    badgeService.checkCampusLegendBadge(user);
                } catch (Exception e) {
                    System.err.println("Error checking Campus Legend badge: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Update office admin's rank based on current points
     */
    @Transactional
    public void updateOfficeAdminRank(OfficeAdmin officeAdmin) {
        if (officeAdmin == null || officeAdmin.getPoints() == null) {
            return;
        }

        UserRank oldRank = officeAdmin.getUserRank();
        if (oldRank == null) {
            oldRank = UserRank.NONE;
        }

        UserRank newRank = UserRank.calculateRank(officeAdmin.getPoints());

        if (oldRank != newRank) {
            officeAdmin.setUserRank(newRank);
            officeAdminRepository.save(officeAdmin);

            // Log rank-up event for office admin
            if (newRank.ordinal() > oldRank.ordinal()) {
                String message = String.format(
                    "🎉 Your office has been promoted to %s rank!",
                    newRank.getDisplayName()
                );
                activityLogService.logActivity(
                    "RANK_UP",
                    message,
                    null,
                    officeAdmin.getUser()
                );
                
                // Check and update Office Legend badge
                try {
                    badgeService.checkOfficeLegendBadge(officeAdmin.getUser());
                } catch (Exception e) {
                    System.err.println("Error checking Office Legend badge: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Get user's rank progress information
     */
    public RankProgressDTO getUserRankProgress(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        // Force recalculate the rank based on points
        Float points = user.getPoints();
        UserRank calculatedRank = UserRank.calculateRank(points != null ? points : 0f);
        
        // Update the rank if it doesn't match
        if (user.getUserRank() != calculatedRank) {
            user.setUserRank(calculatedRank);
            userRepository.save(user);
        }

        return buildRankProgress(
            calculatedRank, // Use the calculated rank instead of the stored one
            points,
            userId,
            true // isUser
        );
    }

    /**
     * Get office admin's rank progress information
     */
    public RankProgressDTO getOfficeAdminRankProgress(Long officeAdminId) {
        OfficeAdmin officeAdmin = officeAdminRepository.findById(officeAdminId)
            .orElseThrow(() -> new RuntimeException("Office admin not found"));
        
        // Force recalculate the rank based on points
        Float points = officeAdmin.getPoints();
        UserRank calculatedRank = UserRank.calculateRank(points != null ? points : 0f);
        
        // Update the rank if it doesn't match
        if (officeAdmin.getUserRank() != calculatedRank) {
            officeAdmin.setUserRank(calculatedRank);
            officeAdminRepository.save(officeAdmin);
        }

        return buildRankProgress(
            calculatedRank, // Use the calculated rank instead of the stored one
            points,
            officeAdminId,
            false // isUser
        );
    }

    /**
     * Get user's rank progress by email (for authenticated user)
     */
    public RankProgressDTO getUserRankProgressByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return getUserRankProgress(user.getId());
    }

    /**
     * Get office admin's rank progress by email (for authenticated office admin)
     */
    public RankProgressDTO getOfficeAdminRankProgressByEmail(String email) {
        OfficeAdmin officeAdmin = officeAdminRepository.findByUser_Email(email)
            .orElseThrow(() -> new RuntimeException("Office admin not found"));

        return getOfficeAdminRankProgress(officeAdmin.getId());
    }

    /**
     * Build rank progress DTO
     */
    private RankProgressDTO buildRankProgress(UserRank currentRank, Float points, Long entityId, boolean isUser) {
        if (currentRank == null) {
            currentRank = UserRank.NONE;
        }
        if (points == null) {
            points = 0.0f;
        }

        UserRank nextRank = currentRank.getNextRank();
        Float pointsToNextRank = currentRank.getPointsToNextRank(points);
        Float progressPercentage = currentRank.getProgressPercentage(points);
        Integer goldRanking = null;

        // If user is GOLD rank, calculate their position in Gold Elite (1-10)
        if (currentRank == UserRank.GOLD) {
            goldRanking = getGoldRanking(entityId, isUser);
        }

        String rankDisplayName = currentRank.getDisplayName();
        if (goldRanking != null && goldRanking <= 10) {
            rankDisplayName = "Gold #" + goldRanking;
        }

        return new RankProgressDTO(
            currentRank,
            points,
            nextRank,
            pointsToNextRank,
            progressPercentage,
            goldRanking,
            rankDisplayName
        );
    }

    /**
     * Get user's position in Gold Elite ranking (1-10 or null)
     */
    private Integer getGoldRanking(Long entityId, boolean isUser) {
        try {
            List<?> goldList;
            if (isUser) {
                goldList = userRepository.findGoldRankedUsers();
            } else {
                goldList = officeAdminRepository.findGoldRankedOfficeAdmins();
            }

            for (int i = 0; i < goldList.size(); i++) {
                Long id;
                if (isUser) {
                    id = ((User) goldList.get(i)).getId();
                } else {
                    id = ((OfficeAdmin) goldList.get(i)).getId();
                }

                if (id.equals(entityId)) {
                    int ranking = i + 1;
                    return ranking <= 10 ? ranking : null; // Only return ranking if in top 10
                }
            }
        } catch (Exception e) {
            System.err.println("Error calculating gold ranking: " + e.getMessage());
        }
        return null;
    }

    /**
     * Get Gold Elite leaderboard for users (Top 10)
     */
    public List<GoldLeaderboardEntry> getGoldEliteUsers() {
        List<Object[]> results = userRepository.getGoldEliteUsers();
        List<GoldLeaderboardEntry> entries = new ArrayList<>();

        for (int i = 0; i < Math.min(results.size(), 10); i++) {
            Object[] row = results.get(i);
            GoldLeaderboardEntry entry = new GoldLeaderboardEntry(
                (Long) row[0],                              // id
                (String) row[1],                            // firstName
                (String) row[2],                            // lastName
                ((Number) row[3]).floatValue(),             // points
                ((Number) row[4]).doubleValue(),            // averageRating
                ((Number) row[5]).intValue()                // totalIncidents
            );
            entry.setGoldRanking(i + 1); // Set ranking 1-10
            entries.add(entry);
        }

        return entries;
    }

    /**
     * Get Gold Elite leaderboard for office admins (Top 10)
     */
    public List<GoldLeaderboardEntry> getGoldEliteOffices() {
        List<Object[]> results = officeAdminRepository.getGoldEliteOfficeAdmins();
        List<GoldLeaderboardEntry> entries = new ArrayList<>();

        for (int i = 0; i < Math.min(results.size(), 10); i++) {
            Object[] row = results.get(i);
            GoldLeaderboardEntry entry = new GoldLeaderboardEntry(
                (Long) row[0],                              // id
                (String) row[1],                            // officeCode
                ((Number) row[2]).floatValue(),             // points
                i + 1,                                      // goldRanking
                ((Number) row[3]).doubleValue(),            // averageRating
                ((Number) row[4]).intValue()                // totalIncidents
            );
            entries.add(entry);
        }

        return entries;
    }

    /**
     * Calculate rank from points (utility method)
     */
    public UserRank calculateRank(float points) {
        return UserRank.calculateRank(points);
    }

    /**
     * Get points required for a specific rank
     */
    public int getPointsRequired(UserRank rank) {
        return rank.getMinPoints();
    }

    /**
     * Batch update ranks for all users (maintenance task)
     */
    @Transactional
    public void updateAllUserRanks() {
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            if (user.getPoints() != null && user.getPoints() > 0) {
                UserRank newRank = UserRank.calculateRank(user.getPoints());
                if (user.getUserRank() != newRank) {
                    user.setUserRank(newRank);
                }
            }
        }
        userRepository.saveAll(allUsers);
    }

    /**
     * Batch update ranks for all office admins (maintenance task)
     */
    @Transactional
    public void updateAllOfficeAdminRanks() {
        List<OfficeAdmin> allOfficeAdmins = officeAdminRepository.findAll();
        for (OfficeAdmin officeAdmin : allOfficeAdmins) {
            if (officeAdmin.getPoints() != null && officeAdmin.getPoints() > 0) {
                UserRank newRank = UserRank.calculateRank(officeAdmin.getPoints());
                if (officeAdmin.getUserRank() != newRank) {
                    officeAdmin.setUserRank(newRank);
                }
            }
        }
        officeAdminRepository.saveAll(allOfficeAdmins);
    }
}

