package com.teamhyungie.WildWatch.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamhyungie.WildWatch.model.Role;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.core.AuthenticationException;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    public OAuth2SuccessHandler(@Lazy UserService userService, JwtUtil jwtUtil, ObjectMapper objectMapper) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauthUser = oauthToken.getPrincipal();
        Map<String, Object> attributes = oauthUser.getAttributes();

        // Extract email from Microsoft OAuth response
        String email = (String) attributes.get("email");
        if (email == null) {
            email = (String) attributes.get("upn"); // Microsoft's User Principal Name
        }

        if (email == null) {
            throw new RuntimeException("No email found in OAuth response");
        }

        // Extract school ID from given_name (format: "22-0073-220 Jhean Hecari")
        String givenName = (String) attributes.get("given_name");
        String schoolIdNumber = null;
        String firstName = null;
        
        if (givenName != null && givenName.matches("\\d{2}-\\d{4}-\\d{3}\\s+.*")) {
            String[] parts = givenName.split("\\s+", 2);
            schoolIdNumber = parts[0];
            firstName = parts[1];
        } else {
            firstName = givenName;
            schoolIdNumber = "TEMP_" + System.currentTimeMillis();
        }

        // Find or create user
        User user = userService.findByUsername(email);
        if (user == null) {
            try {
                // Create new user from OAuth data
                user = new User();
                user.setEmail(email);
                user.setFirstName(firstName);
                user.setLastName((String) attributes.get("family_name"));
                user.setRole(Role.REGULAR_USER);
                user.setEnabled(true);
                user.setTermsAccepted(false); // Ensure new OAuth users must accept terms
                
                // Generate a secure random password for OAuth users
                String randomPassword = UUID.randomUUID().toString().replace("-", "") + "Aa1!";
                user.setPassword(randomPassword);
                
                user.setSchoolIdNumber(schoolIdNumber);
                user.setContactNumber("+639000000000"); // Default contact number
                user.setMiddleInitial(""); // Empty middle initial is allowed
                
                // Save the new user
                user = userService.save(user);
                
                if (user == null) {
                    throw new RuntimeException("Failed to create new user");
                }
                
                System.out.println("Created new user from OAuth: " + user.getEmail());
                System.out.println("School ID: " + schoolIdNumber);
            } catch (Exception e) {
                System.err.println("Error creating new user: " + e.getMessage());
                e.printStackTrace();
                // Redirect to frontend error page with error message
                String errorMessage = URLEncoder.encode("Failed to create user account: " + e.getMessage(), StandardCharsets.UTF_8);
                String redirectUrl = "http://localhost:3000/auth/error?message=" + errorMessage;
                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
                return;
            }
        }

        try {
            // Create UserDetails for JWT
            UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword() != null ? user.getPassword() : "")
                .authorities(user.getRole().name())
                .build();

            // Generate JWT token
            String token = jwtUtil.generateToken(userDetails);

            // Create response object
            Map<String, Object> responseData = Map.of(
                "user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "middleInitial", user.getMiddleInitial(),
                    "schoolIdNumber", user.getSchoolIdNumber(),
                    "contactNumber", user.getContactNumber(),
                    "termsAccepted", user.isTermsAccepted(),
                    "role", user.getRole().name(),
                    "enabled", user.isEnabled()
                ),
                "token", token
            );

            // Convert to JSON and URL encode
            String jsonResponse = objectMapper.writeValueAsString(responseData);
            String encodedResponse = URLEncoder.encode(jsonResponse, StandardCharsets.UTF_8);

            // Redirect to frontend with the encoded data
            String redirectUrl = "http://localhost:3000/auth/oauth2/redirect?data=" + encodedResponse;
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } catch (Exception e) {
            System.err.println("Error processing OAuth login: " + e.getMessage());
            e.printStackTrace();
            // Redirect to frontend error page with error message
            String errorMessage = URLEncoder.encode("Failed to process OAuth login: " + e.getMessage(), StandardCharsets.UTF_8);
            String redirectUrl = "http://localhost:3000/auth/error?message=" + errorMessage;
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
    }
} 