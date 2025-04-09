package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.AuthResponse;
import com.teamhyungie.WildWatch.dto.LoginRequest;
import com.teamhyungie.WildWatch.dto.RegisterRequest;
import com.teamhyungie.WildWatch.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                AuthResponse.builder()
                    .message("Registration failed: " + e.getMessage())
                    .build()
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(
                AuthResponse.builder()
                    .message("Invalid email or password")
                    .build()
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                AuthResponse.builder()
                    .message("Login failed: " + e.getMessage())
                    .build()
            );
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            
            String email = authentication.getName();
            return ResponseEntity.ok(authService.getUserProfile(email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                AuthResponse.builder()
                    .message("Failed to fetch profile: " + e.getMessage())
                    .build()
            );
        }
    }
} 