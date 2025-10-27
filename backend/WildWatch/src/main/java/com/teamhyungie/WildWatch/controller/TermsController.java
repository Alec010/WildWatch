package com.teamhyungie.WildWatch.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
            User user = userService.getUserByEmail(authentication.getName());
            
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
            User user = userService.getUserByEmail(authentication.getName());
            return ResponseEntity.ok(user.isTermsAccepted());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(false);
        }
    }
} 