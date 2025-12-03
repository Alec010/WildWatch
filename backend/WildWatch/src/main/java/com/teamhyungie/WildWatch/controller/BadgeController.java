package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.BadgeProgressDTO;
import com.teamhyungie.WildWatch.dto.UserBadgeSummaryDTO;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.service.BadgeService;
import com.teamhyungie.WildWatch.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for badge-related endpoints
 */
@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    @Autowired
    private BadgeService badgeService;

    @Autowired
    private UserService userService;

    /**
     * Get all badges with progress for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<BadgeProgressDTO>> getUserBadges() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        
        // Ensure progress is up to date before returning
        badgeService.checkAndUpdateBadges(user);
        List<BadgeProgressDTO> badges = badgeService.getUserBadges(user);
        
        // Process any unnotified badges
        badgeService.processUnnotifiedBadges(user);
        
        return ResponseEntity.ok(badges);
    }

    /**
     * Get badge summary for the authenticated user
     */
    @GetMapping("/summary")
    public ResponseEntity<UserBadgeSummaryDTO> getUserBadgeSummary() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        
        // Ensure progress is up to date before returning
        badgeService.checkAndUpdateBadges(user);
        UserBadgeSummaryDTO summary = badgeService.getUserBadgeSummary(user);
        
        // Process any unnotified badges
        badgeService.processUnnotifiedBadges(user);
        
        return ResponseEntity.ok(summary);
    }

    /**
     * Admin endpoint to initialize default badges (includes both user and office admin badges)
     * Use this endpoint after applying database migration V10
     */
    @PostMapping("/admin/initialize")
    public ResponseEntity<String> initializeDefaultBadges() {
        try {
            badgeService.initializeDefaultBadges();
            return ResponseEntity.ok("All badges (user and office admin) initialized successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to initialize badges: " + e.getMessage() + 
                ". Please ensure database migration V10 has been applied.");
        }
    }

    /**
     * Admin endpoint to manually check and update badges for a user
     */
    @PostMapping("/admin/check/{userId}")
    public ResponseEntity<String> checkUserBadges(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        badgeService.checkAndUpdateBadges(user);
        return ResponseEntity.ok("Badges checked and updated for user: " + user.getEmail());
    }

    /**
     * Admin endpoint to manually check and update badges for all users
     */
    @PostMapping("/admin/check-all")
    public ResponseEntity<String> checkAllUserBadges() {
        List<User> users = userService.getAllUsers();
        for (User user : users) {
            badgeService.checkAndUpdateBadges(user);
        }
        
        return ResponseEntity.ok("Badges checked and updated for all users");
    }

    /**
     * Claim a badge (mark as claimed)
     */
    @PostMapping("/claim/{badgeId}")
    public ResponseEntity<String> claimBadge(@PathVariable Long badgeId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        
        try {
            badgeService.claimBadge(user, badgeId);
            return ResponseEntity.ok("Badge claimed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
