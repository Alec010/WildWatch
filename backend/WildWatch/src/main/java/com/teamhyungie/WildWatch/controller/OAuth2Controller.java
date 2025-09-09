package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.AuthResponse;
import com.teamhyungie.WildWatch.model.Role;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.security.JwtUtil;
import com.teamhyungie.WildWatch.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @GetMapping("/success")
    public ResponseEntity<AuthResponse> oauth2Success(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            Map<String, Object> attributes = oauth2User.getAttributes();
            
            String email = (String) attributes.get("email");
            String name = (String) attributes.get("name");
            String givenName = (String) attributes.get("given_name");
            String familyName = (String) attributes.get("family_name");
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Email not provided by OAuth provider")
                    .build());
            }

            // Try to find existing user
            User user;
            try {
                user = userService.findByUsername(email);
            } catch (Exception e) {
                // User doesn't exist, create new one
                user = new User();
                user.setEmail(email);
                user.setFirstName(givenName != null ? givenName : name);
                user.setLastName(familyName != null ? familyName : "");
                user.setPassword(UUID.randomUUID().toString()); // Generate random password for OAuth users
                user.setEnabled(true);
                user.setRole(Role.REGULAR_USER);
                user.setTermsAccepted(false);
                user.setSchoolIdNumber(UUID.randomUUID().toString()); // Generate temporary school ID
                user.setContactNumber("Not provided"); // Set default contact number
                user.setAuthProvider("microsoft");
                
                try {
                    user = userService.save(user);
                } catch (Exception saveEx) {
                    return ResponseEntity.badRequest().body(AuthResponse.builder()
                        .message("Failed to create user account: " + saveEx.getMessage())
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
                    .message("OAuth2 login successful")
                    .build());
        }
        
        return ResponseEntity.badRequest().body(AuthResponse.builder()
                .message("Invalid OAuth2 authentication")
                .build());
    }

    @GetMapping("/failure")
    public ResponseEntity<AuthResponse> oauth2Failure() {
        return ResponseEntity.badRequest().body(AuthResponse.builder()
                .message("OAuth2 login failed")
                .build());
    }



    @PostMapping("/microsoft")
    public ResponseEntity<AuthResponse> handleMicrosoftCallback(@RequestBody Map<String, String> body) {
        try {
            String code = body.get("code");
            if (code == null || code.isEmpty()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Authorization code is required")
                    .build());
            }

            System.out.println("Received Microsoft OAuth code: " + code);
            
            // Quick response - just return a test token without database operations
            // This will help us test the OAuth flow first
            String testToken = "test.oauth.token." + System.currentTimeMillis();
            
            System.out.println("Returning quick test token: " + testToken);
            
            return ResponseEntity.ok(AuthResponse.builder()
                    .token(testToken)
                    .termsAccepted(false)
                    .message("Microsoft OAuth test successful")
                    .build());
                    
        } catch (Exception e) {
            System.out.println("Error in Microsoft OAuth callback: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Failed to process Microsoft OAuth: " + e.getMessage())
                    .build());
        }
    }
} 