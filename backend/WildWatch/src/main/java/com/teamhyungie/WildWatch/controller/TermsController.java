package com.teamhyungie.WildWatch.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.teamhyungie.WildWatch.service.UserService;
import com.teamhyungie.WildWatch.model.User;

@RestController
@RequestMapping("/api/terms")
public class TermsController {

    @Autowired
    private UserService userService;

    @PostMapping("/accept")
    public ResponseEntity<String> acceptTerms(Authentication authentication) {
        try {
            // Extract email from authentication - ensure we get the email, not the name
            String email;
            if (authentication.getPrincipal() instanceof UserDetails) {
                // If principal is UserDetails, getUsername() returns the email
                email = ((UserDetails) authentication.getPrincipal()).getUsername();
            } else {
                // Fallback to getName() but log it for debugging
                email = authentication.getName();
                // Log if it doesn't look like an email
                if (!email.contains("@")) {
                    System.err.println("WARNING: authentication.getName() returned non-email: " + email);
                }
            }
            
            User user = userService.getUserByEmail(email);
            
            user.setTermsAccepted(true);
            user = userService.save(user);
            
            if (!user.isTermsAccepted()) {
                return ResponseEntity.badRequest().body("Failed to update terms acceptance status");
            }
            
            return ResponseEntity.ok("Terms accepted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to accept terms: " + e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> getTermsStatus(Authentication authentication) {
        try {
            // Extract email from authentication - ensure we get the email, not the name
            String email;
            if (authentication.getPrincipal() instanceof UserDetails) {
                email = ((UserDetails) authentication.getPrincipal()).getUsername();
            } else {
                email = authentication.getName();
            }
            
            User user = userService.getUserByEmail(email);
            return ResponseEntity.ok(user.isTermsAccepted());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(false);
        }
    }
} 