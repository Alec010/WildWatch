package com.teamhyungie.WildWatch.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

@Component
public class MobileRedirectFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(MobileRedirectFilter.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Only log for non-heartbeat requests
        if (!request.getRequestURI().contains("/ws") && !request.getRequestURI().contains("/topic")) {
            logger.debug("MobileRedirectFilter processing request: {}", request.getRequestURI());
        }
        
        String state = request.getParameter("state");
        if (state != null && !state.isEmpty()) {
            logger.debug("Found state parameter: {}", state);
            try {
                // First, try to decode as Base64
                String decoded = new String(Base64.getDecoder().decode(state), StandardCharsets.UTF_8);
                logger.debug("Decoded state: {}", decoded);
                
                // Check if the decoded string looks like JSON
                if (decoded.trim().startsWith("{") && decoded.trim().endsWith("}")) {
                    JsonNode stateJson = objectMapper.readTree(decoded);
                    if (stateJson.has("mobile_redirect_uri")) {
                        String mobileRedirectUri = stateJson.get("mobile_redirect_uri").asText();
                        logger.debug("Extracted mobile_redirect_uri: {}", mobileRedirectUri);
                        
                        request.getSession().setAttribute("mobile_redirect_uri", mobileRedirectUri);
                        logger.debug("Set mobile_redirect_uri in session");
                    } else {
                        logger.debug("No mobile_redirect_uri found in state JSON");
                    }
                } else {
                    logger.debug("Decoded state is not valid JSON, skipping mobile redirect URI extraction");
                }
            } catch (IllegalArgumentException e) {
                logger.warn("State parameter is not valid Base64, skipping mobile redirect URI extraction: {}", e.getMessage());
            } catch (Exception e) {
                logger.warn("Error processing state parameter, skipping mobile redirect URI extraction: {}", e.getMessage());
            }
        }
        
        filterChain.doFilter(request, response);
        
        // Only log for non-heartbeat requests
        if (!request.getRequestURI().contains("/ws") && !request.getRequestURI().contains("/topic")) {
            logger.debug("MobileRedirectFilter completed processing");
        }
    }
}