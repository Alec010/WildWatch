package com.teamhyungie.WildWatch.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class MobileOAuthController {

    @Value("${spring.security.oauth2.client.registration.microsoft.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.provider.microsoft.authorization-uri}")
    private String authorizationUri;

    @Value("${spring.security.oauth2.client.registration.microsoft.redirect-uri}")
    private String redirectUri;

    @Value("${spring.security.oauth2.client.registration.microsoft.scope}")
    private String scope;

    @GetMapping("/mobile-microsoft-start")
    public ResponseEntity<Map<String, String>> startMicrosoftOAuth(@RequestParam("mobile_redirect_uri") String mobileRedirectUri) {
        // Build state
        String stateJson = String.format("{\"mobile_redirect_uri\":\"%s\"}", mobileRedirectUri);
        String stateEncoded = Base64.getEncoder().encodeToString(stateJson.getBytes(StandardCharsets.UTF_8));

        // Build Microsoft OAuth2 URL
        String url = authorizationUri +
                "?client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&scope=" + URLEncoder.encode(scope.replace(',', ' '), StandardCharsets.UTF_8) +
                "&state=" + URLEncoder.encode(stateEncoded, StandardCharsets.UTF_8);

        return ResponseEntity.ok(Map.of("url", url));
    }
} 