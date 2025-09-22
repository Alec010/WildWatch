package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.AuthResponse;
import com.teamhyungie.WildWatch.model.Role;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.security.JwtUtil;
import com.teamhyungie.WildWatch.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/mobile/auth")
@RequiredArgsConstructor
public class MobileOAuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${spring.security.oauth2.client.registration.microsoft.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.provider.microsoft.authorization-uri}")
    private String authorizationUri;

    @Value("${spring.security.oauth2.client.registration.microsoft.redirect-uri}")
    private String redirectUri;

    @Value("${spring.security.oauth2.client.registration.microsoft.scope}")
    private String scope;

    @PostMapping("/microsoft/callback")
    public ResponseEntity<AuthResponse> handleMicrosoftCallback(@RequestBody Map<String, String> body) {
        try {
            String code = body.get("code");
            if (code == null || code.isEmpty()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Authorization code is required")
                    .build());
            }

            System.out.println("Received Microsoft OAuth code for mobile: " + code);
            
            // For mobile, we'll return a test token initially
            // The actual token exchange will be handled by the mobile app
            String testToken = "mobile.test.oauth.token." + System.currentTimeMillis();
            
            System.out.println("Returning mobile test token: " + testToken);
            
            return ResponseEntity.ok(AuthResponse.builder()
                    .token(testToken)
                    .termsAccepted(false)
                    .message("Mobile Microsoft OAuth test successful")
                    .build());
                    
        } catch (Exception e) {
            System.out.println("Error in mobile Microsoft OAuth callback: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Failed to process mobile Microsoft OAuth: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/microsoft/token")
    public ResponseEntity<AuthResponse> handleMicrosoftToken(@RequestBody Map<String, Object> body) {
        try {
            String accessToken = (String) body.get("access_token");
            Map<String, Object> userInfo = (Map<String, Object>) body.get("user_info");
            
            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Microsoft access token is required")
                    .build());
            }

            if (userInfo == null) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("User info is required")
                    .build());
            }

            System.out.println("Received mobile Microsoft access token and user info");
            System.out.println("User info: " + userInfo);
            
            // Extract user information
            String email = (String) userInfo.get("email");
            if (email == null) {
                email = (String) userInfo.get("upn"); // Microsoft's User Principal Name
            }
            
            String firstName = (String) userInfo.get("given_name");
            String lastName = (String) userInfo.get("family_name");
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Email not found in Microsoft user info")
                    .build());
            }

            // Find or create user
            User user;
            try {
                user = userService.findByUsername(email);
            } catch (Exception e) {
                // User doesn't exist, create new one
                user = new User();
                user.setEmail(email);
                user.setFirstName(firstName != null ? firstName : "");
                user.setLastName(lastName != null ? lastName : "");
                user.setPassword(UUID.randomUUID().toString());
                user.setEnabled(true);
                user.setRole(Role.REGULAR_USER);
                user.setTermsAccepted(false);
                user.setSchoolIdNumber("MOBILE_TEMP_" + System.currentTimeMillis());
                user.setContactNumber("+639000000000");
                user.setMiddleInitial("");
                user.setAuthProvider("microsoft_mobile");
                
                try {
                    user = userService.save(user);
                } catch (Exception saveEx) {
                    return ResponseEntity.badRequest().body(AuthResponse.builder()
                        .message("Failed to create mobile user account: " + saveEx.getMessage())
                        .build());
                }
            }
            
            // Convert User to UserDetails for JWT generation
            UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities("USER")
                .build();
            
            // Generate JWT token
            String token = jwtUtil.generateToken(userDetails);
            
            return ResponseEntity.ok(AuthResponse.builder()
                    .token(token)
                    .termsAccepted(user.isTermsAccepted())
                    .message("Mobile Microsoft OAuth login successful")
                    .build());
                    
        } catch (Exception e) {
            System.out.println("Error in mobile Microsoft token validation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Failed to process mobile Microsoft token: " + e.getMessage())
                    .build());
        }
    }
} 