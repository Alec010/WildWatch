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

        String state = request.getParameter("state");
        String prompt = request.getParameter("prompt");
        
        // Build additional parameters map
        Map<String, Object> additionalParameters = new HashMap<>(req.getAdditionalParameters());
        
        // Add prompt parameter if provided (e.g., "select_account" to force account selection)
        if (prompt != null && !prompt.isEmpty()) {
            additionalParameters.put("prompt", prompt);
        }
        
        // Build the customized request
        OAuth2AuthorizationRequest.Builder builder = OAuth2AuthorizationRequest.from(req)
                .additionalParameters(additionalParameters);
        
        // Use the provided state (from mobile) instead of Spring's generated one if provided
        if (state != null && !state.isEmpty()) {
            builder.state(state);
        }
        
        return builder.build();
    }
} 