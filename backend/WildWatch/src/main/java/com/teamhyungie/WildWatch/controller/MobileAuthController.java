package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.service.MobileAuthService;
import com.teamhyungie.WildWatch.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/mobile/auth")
@RequiredArgsConstructor
public class MobileAuthController {

    private final UserService userService;
    private final MobileAuthService mobileAuthService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Mobile-specific setup endpoint for OAuth users
     * Only accepts microsoft_mobile auth provider
     */
    @PostMapping("/setup")
    public ResponseEntity<?> setupMobileOAuthUser(
            @RequestBody SetupRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userService.getUserByEmail(userDetails.getUsername());

            // Verify this is a Microsoft Mobile OAuth user
            String authProvider = user.getAuthProvider();
            if (authProvider == null || !"microsoft_mobile".equals(authProvider)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "This endpoint is only for Microsoft Mobile OAuth users. Current provider: " + 
                        (authProvider != null ? authProvider : "null")));
            }

            // Validate contact number format
            if (request.getContactNumber() == null || request.getContactNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Contact number is required"));
            }
            
            // Validate password
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Password is required"));
            }
            
            if (request.getPassword().length() < 8) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Password must be at least 8 characters long"));
            }

            // Update user's contact number and password
            user.setContactNumber(request.getContactNumber());
            user.setPassword(passwordEncoder.encode(request.getPassword()));

            userService.save(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Account setup completed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Failed to setup account: " + e.getMessage()));
        }
    }

    /**
     * Mobile-specific profile endpoint that includes passwordNeedsSetup
     */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getMobileProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Map<String, Object> profile = mobileAuthService.getMobileUserProfile(userDetails.getUsername());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Setup request DTO for mobile
     */
    public static class SetupRequest {
        private String contactNumber;
        private String password;

        public String getContactNumber() {
            return contactNumber;
        }

        public void setContactNumber(String contactNumber) {
            this.contactNumber = contactNumber;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}

