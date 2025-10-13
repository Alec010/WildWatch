package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.GoldLeaderboardEntry;
import com.teamhyungie.WildWatch.dto.RankProgressDTO;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.model.UserRank;
import com.teamhyungie.WildWatch.repository.OfficeAdminRepository;
import com.teamhyungie.WildWatch.service.RankService;
import com.teamhyungie.WildWatch.service.UserService;

import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for rank-related endpoints
 */
@RestController
@RequestMapping("/api/ranks")
public class RankController {

    @Autowired
    private RankService rankService;

    @Autowired
    private UserService userService;

    @Autowired
    private OfficeAdminRepository officeAdminRepository;

    /**
     * Get rank progress for a specific user
     * @param userId User ID
     * @return RankProgressDTO with current rank and progress info
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<RankProgressDTO> getUserRank(@PathVariable Long userId) {
        try {
            RankProgressDTO rankProgress = rankService.getUserRankProgress(userId);
            return ResponseEntity.ok(rankProgress);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get rank progress for a specific office admin
     * @param officeId Office Admin ID
     * @return RankProgressDTO with current rank and progress info
     */
    @GetMapping("/office/{officeId}")
    public ResponseEntity<RankProgressDTO> getOfficeRank(@PathVariable Long officeId) {
        try {
            RankProgressDTO rankProgress = rankService.getOfficeAdminRankProgress(officeId);
            return ResponseEntity.ok(rankProgress);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get authenticated user's rank progress (handles both users and office admins)
     * @param authentication Spring Security authentication object
     * @return RankProgressDTO with current rank and progress info
     */
    @GetMapping("/my-rank")
    public ResponseEntity<RankProgressDTO> getMyRank(Authentication authentication) {
        try {
            String email = authentication.getName();
            RankProgressDTO rankProgress;
            
            // First, try to find as office admin (since office admins are more specific)
            try {
                OfficeAdmin officeAdmin = officeAdminRepository.findByUser_Email(email).orElse(null);
                if (officeAdmin != null) {
                    rankProgress = rankService.getOfficeAdminRankProgress(officeAdmin.getId());
                    return ResponseEntity.ok(rankProgress);
                }
            } catch (Exception e) {
                // Office admin not found, continue to try as regular user
            }
            
            // If not found as office admin, try as regular user
            try {
                rankProgress = rankService.getUserRankProgressByEmail(email);
                return ResponseEntity.ok(rankProgress);
            } catch (RuntimeException e) {
                // User not found either
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get Gold Elite leaderboard for users (Top 10 with 300+ points)
     * @return List of top 10 gold-ranked users
     */
    @GetMapping("/gold-elite/users")
    public ResponseEntity<List<GoldLeaderboardEntry>> getGoldEliteUsers() {
        List<GoldLeaderboardEntry> goldElite = rankService.getGoldEliteUsers();
        return ResponseEntity.ok(goldElite);
    }

    /**
     * Get Gold Elite leaderboard for offices (Top 10 with 300+ points)
     * @return List of top 10 gold-ranked offices
     */
    @GetMapping("/gold-elite/offices")
    public ResponseEntity<List<GoldLeaderboardEntry>> getGoldEliteOffices() {
        List<GoldLeaderboardEntry> goldElite = rankService.getGoldEliteOffices();
        return ResponseEntity.ok(goldElite);
    }
    
    /**
     * Debug endpoint to check office admin rank calculation
     */
    @GetMapping("/debug/office-rank")
    public ResponseEntity<Map<String, Object>> debugOfficeRank(Authentication authentication) {
        try {
            String email = authentication.getName();
            Map<String, Object> debugInfo = new HashMap<>();
            
            OfficeAdmin officeAdmin = officeAdminRepository.findByUser_Email(email).orElse(null);
            if (officeAdmin != null) {
                debugInfo.put("officeAdminId", officeAdmin.getId());
                debugInfo.put("points", officeAdmin.getPoints());
                debugInfo.put("currentRank", officeAdmin.getUserRank());
                debugInfo.put("calculatedRank", UserRank.calculateRank(officeAdmin.getPoints()));
                
                // Force update the rank
                UserRank newRank = UserRank.calculateRank(officeAdmin.getPoints());
                officeAdmin.setUserRank(newRank);
                officeAdminRepository.save(officeAdmin);
                debugInfo.put("updatedRank", officeAdmin.getUserRank());
                
                return ResponseEntity.ok(debugInfo);
            }
            
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Recalculate rank for the current user
     */
    @PostMapping("/recalculate-my-rank")
    public ResponseEntity<String> recalculateMyRank(Authentication authentication) {
        try {
            String email = authentication.getName();
            
            // First, try to find as office admin (since office admins are more specific)
            try {
                OfficeAdmin officeAdmin = officeAdminRepository.findByUser_Email(email).orElse(null);
                if (officeAdmin != null) {
                    rankService.updateOfficeAdminRank(officeAdmin);
                    return ResponseEntity.ok("Successfully recalculated your office rank");
                }
            } catch (Exception e) {
                // Office admin not found, continue to try as regular user
            }
            
            // If not found as office admin, try as regular user
            try {
                User user = userService.getUserByEmail(email);
                if (user != null) {
                    rankService.updateUserRank(user);
                    return ResponseEntity.ok("Successfully recalculated your rank");
                }
            } catch (Exception e) {
                // User not found either
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error recalculating rank: " + e.getMessage());
        }
    }

    /**
     * Admin endpoint: Trigger rank recalculation for all users
     * @return Success message
     */
    @PostMapping("/admin/recalculate-all")
    public ResponseEntity<String> recalculateAllRanks() {
        try {
            rankService.updateAllUserRanks();
            rankService.updateAllOfficeAdminRanks();
            return ResponseEntity.ok("Successfully recalculated all ranks");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error recalculating ranks: " + e.getMessage());
        }
    }
}

