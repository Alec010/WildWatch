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
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

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

            // For mobile, we'll return a test token initially
            // The actual token exchange will be handled by the mobile app
            String testToken = "mobile.test.oauth.token." + System.currentTimeMillis();
            
            return ResponseEntity.ok(AuthResponse.builder()
                    .token(testToken)
                    .termsAccepted(false)
                    .message("Mobile Microsoft OAuth test successful")
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Failed to process mobile Microsoft OAuth: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/microsoft/token")
    public ResponseEntity<AuthResponse> handleMicrosoftToken(@RequestBody Map<String, Object> body) {
        User user = null;
        String email = null;
        
        try {
            String accessToken = (String) body.get("access_token");
            Object userInfoObj = body.get("user_info");
            
            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Microsoft access token is required")
                    .build());
            }

            if (userInfoObj == null) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("User info is required")
                    .build());
            }

            // Handle userInfo which might be a Map or other structure
            Map<String, Object> userInfo;
            if (userInfoObj instanceof Map) {
                userInfo = (Map<String, Object>) userInfoObj;
            } else {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Invalid user info format")
                    .build());
            }
            
            // Extract user information
            email = (String) userInfo.get("email");
            if (email == null) {
                email = (String) userInfo.get("upn"); // Microsoft's User Principal Name
            }
            
            String givenName = (String) userInfo.get("given_name");
            String lastName = (String) userInfo.get("family_name");
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Email not found in Microsoft user info")
                    .build());
            }

            // Extract school ID from given_name if it matches the pattern (e.g., "22-3326-574 Katrina")
            // Format: "ID-NUMBER FirstName" or just "FirstName"
            String schoolIdNumber = null;
            String firstName = null;
            
            if (givenName != null && givenName.matches("^\\d{2}-\\d{4}-\\d{3}\\s+.*")) {
                // Pattern matches: "22-3326-574 FirstName" or "22-3326-574 FirstName LastName"
                String[] parts = givenName.split("\\s+", 2);
                schoolIdNumber = parts[0];
                firstName = parts.length > 1 ? parts[1] : "User";
            } else {
                // No school ID in given_name, use given_name as firstName
                firstName = (givenName != null && !givenName.trim().isEmpty()) ? givenName.trim() : "User";
                schoolIdNumber = "MOBILE_TEMP_" + System.currentTimeMillis();
            }

            // Find or create user
            // Flow for new Microsoft OAuth users:
            // 1. Check if user exists - if not, create new user with:
            //    - termsAccepted = false (must go to terms page)
            //    - contactNumber = "+639000000000" (placeholder, must go to setup)
            //    - password = temporary UUID (must go to setup)
            // 2. Return user data indicating registration status
            // 3. Mobile app will route: Terms -> Setup -> Dashboard
            try {
                user = userService.findByUsername(email);
            } catch (Exception lookupEx) {
                user = null; // Ensure user is null if lookup fails
            }
            
            if (user == null) {
                // Check if email already exists (might have been created between lookup and save)
                boolean emailExists = userService.existsByEmail(email);
                
                if (emailExists) {
                    user = userService.findByUsername(email);
                    if (user == null) {
                        return ResponseEntity.badRequest().body(AuthResponse.builder()
                            .message("Email already registered but user not found")
                            .build());
                    }
                } else {
                    // User doesn't exist, create new one with default values
                    // This will require them to complete terms and setup
                    user = new User();
                    user.setEmail(email);
                    
                    // Ensure firstName and lastName are not blank (required by @NotBlank validation)
                    String validFirstName = (firstName != null && !firstName.trim().isEmpty()) ? firstName.trim() : "User";
                    String validLastName = (lastName != null && !lastName.trim().isEmpty()) ? lastName.trim() : "Account";
                    
                    user.setFirstName(validFirstName);
                    user.setLastName(validLastName);
                    
                    // Generate a UUID password that meets @Size(min = 8) requirement
                    String tempPassword = UUID.randomUUID().toString().replace("-", "") + "Aa1!";
                    user.setPassword(tempPassword); // Temporary password (will be replaced during setup)
                    
                    user.setEnabled(true);
                    user.setRole(Role.REGULAR_USER);
                    user.setTermsAccepted(false); // Must accept terms
                    
                    // Set school ID number (extracted from given_name or temporary)
                    user.setSchoolIdNumber(schoolIdNumber);
                    
                    // Ensure contact number matches @Pattern validation: ^\+?[0-9]{10,15}$
                    // "+639000000000" = +639000000000 = + followed by 12 digits (valid)
                    user.setContactNumber("+639000000000"); // Default placeholder
                    
                    user.setMiddleInitial("");
                    user.setAuthProvider("microsoft_mobile");
                    
                    // Final validation check before save
                    if (user.getEmail() == null || user.getFirstName() == null || user.getLastName() == null ||
                        user.getPassword() == null || user.getContactNumber() == null || user.getSchoolIdNumber() == null) {
                        return ResponseEntity.badRequest().body(AuthResponse.builder()
                            .message("Failed to create user: Missing required fields")
                            .build());
                    }
                    
                    try {
                        User savedUser = userService.save(user);
                        
                        if (savedUser == null) {
                            return ResponseEntity.badRequest().body(AuthResponse.builder()
                                .message("Failed to create mobile user account: Save operation returned null")
                                .build());
                        }
                        
                        // Verify saved user has email
                        if (savedUser.getEmail() == null) {
                            return ResponseEntity.badRequest().body(AuthResponse.builder()
                                .message("Failed to create mobile user account: Saved user has invalid data")
                                .build());
                        }
                        
                        user = savedUser; // Use the saved user
                    } catch (DataIntegrityViolationException dataEx) {
                        // Check if it's a duplicate key constraint - try to fetch existing user
                        User existingUser = userService.findByUsername(email);
                        if (existingUser == null) {
                            return ResponseEntity.badRequest().body(AuthResponse.builder()
                                .message("Failed to create mobile user account: Duplicate entry and user not found")
                                .build());
                        }
                        user = existingUser;
                    } catch (ConstraintViolationException constraintEx) {
                        StringBuilder errorMsg = new StringBuilder("Validation failed: ");
                        for (ConstraintViolation<?> violation : constraintEx.getConstraintViolations()) {
                            errorMsg.append(violation.getPropertyPath()).append(" ").append(violation.getMessage()).append("; ");
                        }
                        return ResponseEntity.badRequest().body(AuthResponse.builder()
                            .message(errorMsg.toString())
                            .build());
                    } catch (Exception saveEx) {
                        // Check if it's a duplicate key constraint (for other exception types)
                        String errorMsg = saveEx.getMessage() != null ? saveEx.getMessage() : "";
                        if (errorMsg.contains("duplicate") || 
                             errorMsg.contains("constraint") ||
                             errorMsg.contains("unique") ||
                             errorMsg.contains("DuplicateKey")) {
                            // Try to fetch the existing user
                            User existingUser = userService.findByUsername(email);
                            if (existingUser != null) {
                                user = existingUser;
                            } else {
                                return ResponseEntity.badRequest().body(AuthResponse.builder()
                                    .message("Failed to create mobile user account: Duplicate entry and user not found")
                                    .build());
                            }
                        } else {
                            return ResponseEntity.badRequest().body(AuthResponse.builder()
                                .message("Failed to create mobile user account: " + errorMsg)
                                .build());
                        }
                    }
                }
            } else {
                // Verify existing user is valid
                if (user.getEmail() == null) {
                    return ResponseEntity.badRequest().body(AuthResponse.builder()
                        .message("Invalid user data found in database")
                        .build());
                }
            }
            
            // Final null check before using user
            if (user == null) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Failed to get or create user account: User is null")
                    .build());
            }
            
            // Validate user has required fields
            String userEmailCheck = user.getEmail();
            
            if (userEmailCheck == null || userEmailCheck.isEmpty()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Failed to get or create user account: User email is invalid")
                    .build());
            }
            
            // Convert User to UserDetails for JWT generation
            String userEmail = user.getEmail(); // Store in local variable to avoid repeated getter calls
            UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(userEmail)
                .password(user.getPassword() != null ? user.getPassword() : "")
                .authorities("USER")
                .build();
            
            // Generate JWT token
            String token = jwtUtil.generateToken(userDetails);
            
            // Create user map for response (needed for mobile app to check registration status)
            Map<String, Object> userMap = new java.util.HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("email", userEmail);
            userMap.put("firstName", user.getFirstName());
            userMap.put("lastName", user.getLastName());
            userMap.put("middleInitial", user.getMiddleInitial());
            userMap.put("schoolIdNumber", user.getSchoolIdNumber());
            userMap.put("contactNumber", user.getContactNumber());
            userMap.put("termsAccepted", user.isTermsAccepted());
            userMap.put("role", user.getRole().name());
            userMap.put("enabled", user.isEnabled());
            userMap.put("authProvider", user.getAuthProvider());
            
            // Check if password needs setup
            // New OAuth users get UUID + "Aa1!" as temporary password (32 chars + 4 = 36 chars, no hyphens)
            // Users who completed setup have hashed passwords (starts with $2a$, $2b$, etc., typically 60+ chars)
            String userPassword = user.getPassword();
            boolean passwordNeedsSetup = false;
            if (userPassword != null) {
                // Hashed passwords start with $ and are typically 60+ characters long
                // Temporary passwords are UUID-based (32 chars) + "Aa1!" = 36 chars
                passwordNeedsSetup = !userPassword.startsWith("$") && userPassword.length() <= 40;
            } else {
                passwordNeedsSetup = true;
            }
            userMap.put("password", passwordNeedsSetup ? null : "set");
            
            return ResponseEntity.ok(AuthResponse.builder()
                    .token(token)
                    .termsAccepted(user.isTermsAccepted())
                    .user(userMap)
                    .message("Mobile Microsoft OAuth login successful")
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("Failed to process mobile Microsoft token: " + e.getMessage())
                    .build());
        }
    }
} 