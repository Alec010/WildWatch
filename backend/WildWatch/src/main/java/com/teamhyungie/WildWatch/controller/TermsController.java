package com.teamhyungie.WildWatch.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.teamhyungie.WildWatch.service.UserService;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/terms")
public class TermsController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Extract email from authentication, with fallback to JWT token extraction
     * This handles cases where Microsoft cached credentials might not set UserDetails properly
     */
    private String extractEmailFromAuthentication(Authentication authentication, HttpServletRequest request) {
        // First, try to get email from UserDetails (normal case)
        if (authentication.getPrincipal() instanceof UserDetails) {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            if (email != null && email.contains("@")) {
                return email;
            }
        }
        
        // If UserDetails is not available or doesn't contain email, try to extract from JWT token
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String email = jwtUtil.extractUsername(token);
                if (email != null && email.contains("@")) {
                    return email;
                }
            }
        } catch (Exception e) {
            // Log but continue to fallback
            System.err.println("WARNING: Failed to extract email from JWT token: " + e.getMessage());
        }
        
        // Last resort: try authentication.getName() but validate it's an email
        String name = authentication.getName();
        if (name != null && name.contains("@")) {
            return name;
        }
        
        // If we still don't have a valid email, throw an exception
        throw new RuntimeException("Unable to extract valid email from authentication. Got: " + name);
    }

    @PostMapping("/accept")
    public ResponseEntity<String> acceptTerms(Authentication authentication, HttpServletRequest request) {
        try {
            // Extract email using the improved method
            String email = extractEmailFromAuthentication(authentication, request);
            
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
    public ResponseEntity<Boolean> getTermsStatus(Authentication authentication, HttpServletRequest request) {
        try {
            // Extract email using the improved method
            String email = extractEmailFromAuthentication(authentication, request);
            
            User user = userService.getUserByEmail(email);
            return ResponseEntity.ok(user.isTermsAccepted());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(false);
        }
    }
} 