package com.teamhyungie.WildWatch.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamhyungie.WildWatch.config.FrontendConfig;
import com.teamhyungie.WildWatch.model.Role;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.security.JwtUtil;
import com.teamhyungie.WildWatch.service.UserService;

import jakarta.servlet.http.HttpServletResponse;

@Controller
public class MicrosoftOAuthCallbackController {

    private static final Logger logger = LoggerFactory.getLogger(MicrosoftOAuthCallbackController.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.security.oauth2.client.registration.microsoft.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.microsoft.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.microsoft.redirect-uri}")
    private String redirectUri;

    @Value("${spring.security.oauth2.client.provider.microsoft.token-uri}")
    private String tokenUri;

    @Value("${spring.security.oauth2.client.provider.microsoft.user-info-uri}")
    private String userInfoUri;

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final FrontendConfig frontendConfig;

    public MicrosoftOAuthCallbackController(UserService userService, JwtUtil jwtUtil, FrontendConfig frontendConfig) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.frontendConfig = frontendConfig;
    }

    @GetMapping("/login/oauth2/code/microsoft")
    public void handleMicrosoftCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String state,
            HttpServletResponse response
    ) throws Exception {
        logger.info("[OAuthCallback] Received Microsoft OAuth callback with state: {}", state);

        // 1. Decode state and extract mobile_redirect_uri
        String decodedState = null;
        try {
            decodedState = new String(Base64.getDecoder().decode(state), StandardCharsets.UTF_8);
            logger.info("[OAuthCallback] Decoded state: {}", decodedState);
        } catch (Exception e) {
            logger.error("[OAuthCallback] Failed to decode state: {}", e.getMessage());
        }

        String mobileRedirectUri = null;
        try {
            if (decodedState != null) {
                JsonNode stateJson = objectMapper.readTree(decodedState);
                if (stateJson.has("mobile_redirect_uri")) {
                    mobileRedirectUri = stateJson.get("mobile_redirect_uri").asText();
                    logger.info("[OAuthCallback] Extracted mobile_redirect_uri: {}", mobileRedirectUri);
                } else {
                    logger.warn("[OAuthCallback] No mobile_redirect_uri found in state JSON");
                }
            }
        } catch (Exception e) {
            logger.error("[OAuthCallback] Error parsing state JSON: {}", e.getMessage());
        }

        // 2. Exchange code for tokens
        logger.info("[OAuthCallback] Exchanging code for tokens with Microsoft");
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8)
                + "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&grant_type=authorization_code";

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> tokenResponse = restTemplate.exchange(tokenUri, HttpMethod.POST, request, String.class);
        logger.info("Received token response from Microsoft");

        JsonNode tokenJson = objectMapper.readTree(tokenResponse.getBody());
        String accessToken = tokenJson.get("access_token").asText();
        logger.info("Successfully extracted access token");

        // 3. Get user info from Microsoft
        logger.info("[OAuthCallback] Fetching user info from Microsoft");
        HttpHeaders userInfoHeaders = new HttpHeaders();
        userInfoHeaders.setBearerAuth(accessToken);
        HttpEntity<Void> userInfoRequest = new HttpEntity<>(userInfoHeaders);
        ResponseEntity<String> userInfoResponse = restTemplate.exchange(userInfoUri, HttpMethod.GET, userInfoRequest, String.class);
        logger.info("Received user info response from Microsoft");

        JsonNode userInfo = objectMapper.readTree(userInfoResponse.getBody());
        String email = userInfo.has("email") ? userInfo.get("email").asText() : userInfo.get("upn").asText();
        String givenName = userInfo.has("given_name") ? userInfo.get("given_name").asText() : "";
        String lastName = userInfo.has("family_name") ? userInfo.get("family_name").asText() : "";
        
        // Extract school ID from given_name if it matches the pattern (e.g., "22-3326-574 FirstName")
        // Format: "ID-NUMBER FirstName" or just "FirstName"
        String schoolIdNumber = null;
        String firstName = null;
        
        if (givenName != null && givenName.matches("\\d{2}-\\d{4}-\\d{3}\\s+.*")) {
            // Pattern matches: "22-3326-574 FirstName" or "22-3326-574 FirstName LastName"
            String[] parts = givenName.split("\\s+", 2);
            schoolIdNumber = parts[0];
            firstName = parts.length > 1 ? parts[1] : "User";
            logger.info("Extracted school ID: {} and firstName: {} from given_name: {}", schoolIdNumber, firstName, givenName);
        } else {
            // No school ID in given_name, use given_name as firstName
            firstName = (givenName != null && !givenName.trim().isEmpty()) ? givenName.trim() : "User";
            schoolIdNumber = "TEMP_" + System.currentTimeMillis();
            logger.info("No school ID found in given_name ({}), using temporary ID: {}", givenName, schoolIdNumber);
        }
        
        logger.info("Extracted user info - email: {}, firstName: {}, lastName: {}, schoolIdNumber: {}", 
                email, firstName, lastName, schoolIdNumber);

        // 4. Find or create user in your DB
        logger.info("[OAuthCallback] Looking up user in database");
        User user = userService.findByUsername(email);
        if (user == null) {
            logger.info("User not found, creating new user");
            user = new User();
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setRole(Role.REGULAR_USER);
            user.setEnabled(true);
            user.setTermsAccepted(false);
            user.setPassword(UUID.randomUUID().toString());
            user.setSchoolIdNumber(schoolIdNumber);
            user.setContactNumber("+639000000000");
            user.setMiddleInitial("");
            user.setAuthProvider("microsoft");
            user = userService.save(user);
            logger.info("Created new user with ID: {}", user.getId());
        } else {
            logger.info("Found existing user with ID: {}", user.getId());
        }

        // 5. Generate JWT
        logger.info("[OAuthCallback] Generating JWT token");
        org.springframework.security.core.userdetails.UserDetails userDetails
                = org.springframework.security.core.userdetails.User
                        .withUsername(user.getEmail())
                        .password(user.getPassword() != null ? user.getPassword() : "")
                        .authorities(user.getRole().name())
                        .build();
        String token = jwtUtil.generateToken(userDetails);
        logger.info("Generated JWT token successfully");

        // 6. Redirect to mobile app or web frontend with token
        String redirectUrl;
        if (mobileRedirectUri != null && !mobileRedirectUri.isEmpty()) {
            redirectUrl = String.format("%s?token=%s&termsAccepted=%s",
                    mobileRedirectUri,
                    URLEncoder.encode(token, StandardCharsets.UTF_8),
                    user.isTermsAccepted());
            logger.info("[OAuthCallback] Redirecting to mobile app URL: {}", redirectUrl);
        } else {
            redirectUrl = String.format("%s/auth/oauth2/redirect?token=%s&termsAccepted=%s",
                    frontendConfig.getActiveUrl(),
                    URLEncoder.encode(token, StandardCharsets.UTF_8),
                    user.isTermsAccepted());
            logger.info("[OAuthCallback] Redirecting to web frontend: {}", redirectUrl);
        }
        response.sendRedirect(redirectUrl);
        logger.info("[OAuthCallback] Redirect response sent");
    }
}
