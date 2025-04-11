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

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

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

        // Find or create user
        User user = userService.findByUsername(email);
        if (user == null) {
            // Create new user from OAuth data
            user = new User();
            user.setEmail(email);
            user.setFirstName((String) attributes.get("given_name"));
            user.setLastName((String) attributes.get("family_name"));
            user.setRole(Role.REGULAR_USER);
            user.setEnabled(true);
            user = userService.save(user);
        }

        // Create UserDetails for JWT
        UserDetails userDetails = org.springframework.security.core.userdetails.User
            .withUsername(user.getEmail())
            .password(user.getPassword())
            .authorities("USER")
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
        String redirectUrl = "http://localhost:3000/oauth2/redirect?data=" + encodedResponse;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
} 