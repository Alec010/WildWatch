package com.teamhyungie.WildWatch.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.teamhyungie.WildWatch.service.UserService;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/terms")
public class TermsController {

    @Autowired
    private UserService userService;

    @PostMapping("/accept")
    public ResponseEntity<String> acceptTerms(Authentication authentication) {
        try {
            String email = null;
            if (authentication.getPrincipal() instanceof UserDetails userDetails) {
                email = userDetails.getUsername();
            } else if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
                Object emailObj = oauth2User.getAttribute("email");
                if (emailObj == null) emailObj = oauth2User.getAttribute("upn");
                if (emailObj == null) emailObj = oauth2User.getAttribute("mail");
                if (emailObj == null) emailObj = oauth2User.getAttribute("userPrincipalName");
                if (emailObj != null) email = emailObj.toString();
            }
            if (email == null) {
                return ResponseEntity.badRequest().body("User email not found in authentication principal");
            }
            User user = userService.findByUsername(email);
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }
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
            User user = userService.findByUsername(authentication.getName());
            if (user == null) {
                return ResponseEntity.badRequest().body(false);
            }
            return ResponseEntity.ok(user.isTermsAccepted());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(false);
        }
    }
} 