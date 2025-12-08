package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.AuthResponse;
import com.teamhyungie.WildWatch.dto.LoginRequest;
import com.teamhyungie.WildWatch.dto.RegisterRequest;
import com.teamhyungie.WildWatch.service.AuthService;
import com.teamhyungie.WildWatch.service.UserService;
import com.teamhyungie.WildWatch.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Cookie;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.teamhyungie.WildWatch.model.User;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and user management endpoints")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Operation(summary = "Register a new user", description = "Create a new user account with email and password")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User registered successfully",
                content = @Content(schema = @Schema(implementation = AuthResponse.class))),
        @ApiResponse(responseCode = "400", description = "Registration failed")
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    AuthResponse.builder()
                            .message("Registration failed: " + e.getMessage())
                            .build());
        }
    }

    @Operation(summary = "User login", description = "Authenticate user with email and password")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login successful",
                content = @Content(schema = @Schema(implementation = AuthResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid credentials")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(
                    AuthResponse.builder()
                            .message("Invalid email or password")
                            .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    AuthResponse.builder()
                            .message("Login failed: " + e.getMessage())
                            .build());
        }
    }

    @Operation(summary = "Get user profile", description = "Retrieve the authenticated user's profile information")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Profile retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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
                            .build());
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            userService.verifyEmail(token);
            return ResponseEntity.ok().body(Map.of(
                    "message", "Email verified successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password-request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || !email.endsWith("@cit.edu")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Invalid email address"));
            }

            userService.requestPasswordReset(email);
            return ResponseEntity.ok().body(Map.of(
                    "message", "Password reset link has been sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            if (token == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Token and new password are required"));
            }

            userService.resetPassword(token, newPassword);
            return ResponseEntity.ok().body(Map.of(
                    "message", "Password has been reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/setup")
    public ResponseEntity<?> setupOAuthUser(
            @RequestBody SetupRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userService.getUserByEmail(userDetails.getUsername());

            // Verify this is a Microsoft Web OAuth user only
            String authProvider = user.getAuthProvider();
            if (authProvider == null || !"microsoft".equals(authProvider)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "This endpoint is only for Microsoft OAuth users. Current provider: " + 
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

            // Update school ID if provided and user currently has TEMP ID
            if (request.getSchoolIdNumber() != null && !request.getSchoolIdNumber().trim().isEmpty()) {
                String currentSchoolId = user.getSchoolIdNumber();
                if (currentSchoolId != null && currentSchoolId.startsWith("TEMP_")) {
                    // Validate format: XX-XXXX-XXX
                    String schoolIdPattern = "^\\d{2}-\\d{4}-\\d{3}$";
                    if (request.getSchoolIdNumber().matches(schoolIdPattern)) {
                        // Check if school ID already exists
                        if (userService.existsBySchoolIdNumber(request.getSchoolIdNumber())) {
                            return ResponseEntity.badRequest().body(Map.of(
                                    "message", "This school ID number is already registered"));
                        }
                        user.setSchoolIdNumber(request.getSchoolIdNumber().trim());
                    } else {
                        return ResponseEntity.badRequest().body(Map.of(
                                "message", "School ID must be in format XX-XXXX-XXX (e.g., 22-3326-574)"));
                    }
                }
            }

            userService.save(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Account setup completed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Failed to setup account: " + e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        try {
            String jwt = null;

            // Try to get token from Authorization header
            final String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            }

            // If not in header, try to get from cookie
            if (jwt == null) {
                Cookie[] cookies = request.getCookies();
                if (cookies != null) {
                    for (Cookie cookie : cookies) {
                        if ("token".equals(cookie.getName())) {
                            jwt = cookie.getValue();
                            break;
                        }
                    }
                }
            }

            if (jwt == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No token provided"));
            }

            // Extract username from token (even if expired)
            String userEmail;
            try {
                userEmail = jwtUtil.extractUsernameIgnoreExpiration(jwt);
            } catch (Exception e) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
            }

            // Load user details
            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

            // Generate new token
            String newToken = jwtUtil.generateToken(userDetails);

            return ResponseEntity.ok(Map.of(
                    "token", newToken,
                    "message", "Token refreshed successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to refresh token"));
        }
    }
}

class SetupRequest {

    private String contactNumber;
    private String password;
    private String schoolIdNumber;

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

    public String getSchoolIdNumber() {
        return schoolIdNumber;
    }

    public void setSchoolIdNumber(String schoolIdNumber) {
        this.schoolIdNumber = schoolIdNumber;
    }
}
