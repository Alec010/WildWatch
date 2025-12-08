package com.teamhyungie.WildWatch.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.HashMap;
import java.util.Map;

public class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {
    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    public CustomAuthorizationRequestResolver(ClientRegistrationRepository repo, String authorizationRequestBaseUri) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(repo, authorizationRequestBaseUri);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request);
        return customizeAuthorizationRequest(request, req);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request, clientRegistrationId);
        return customizeAuthorizationRequest(request, req);
    }

    private OAuth2AuthorizationRequest customizeAuthorizationRequest(HttpServletRequest request, OAuth2AuthorizationRequest req) {
        if (req == null) return null;

        // Build additional parameters map
        Map<String, Object> additionalParams = new HashMap<>();
        
        // Add prompt=select_account to force account selection/login prompt
        additionalParams.put("prompt", "select_account");
        
        // Copy existing additional parameters if any
        if (req.getAdditionalParameters() != null) {
            additionalParams.putAll(req.getAdditionalParameters());
        }

        // Build the customized request
        OAuth2AuthorizationRequest.Builder builder = OAuth2AuthorizationRequest.from(req)
                .additionalParameters(additionalParams);

        // Handle state parameter if provided
        String state = request.getParameter("state");
        if (state != null && !state.isEmpty()) {
            // Use the provided state (from mobile) instead of Spring's generated one
            builder.state(state);
        }

        return builder.build();
    }
} 