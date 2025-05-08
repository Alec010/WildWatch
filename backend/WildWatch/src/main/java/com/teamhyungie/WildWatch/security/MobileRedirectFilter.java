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
        
        logger.info("MobileRedirectFilter processing request: {}", request.getRequestURI());
        
        String state = request.getParameter("state");
        if (state != null && !state.isEmpty()) {
            logger.info("Found state parameter: {}", state);
            try {
                String decoded = new String(Base64.getDecoder().decode(state), StandardCharsets.UTF_8);
                logger.info("Decoded state: {}", decoded);
                
                JsonNode stateJson = objectMapper.readTree(decoded);
                if (stateJson.has("mobile_redirect_uri")) {
                    String mobileRedirectUri = stateJson.get("mobile_redirect_uri").asText();
                    logger.info("Extracted mobile_redirect_uri: {}", mobileRedirectUri);
                    
                    request.getSession().setAttribute("mobile_redirect_uri", mobileRedirectUri);
                    logger.info("Set mobile_redirect_uri in session");
                } else {
                    logger.warn("No mobile_redirect_uri found in state JSON");
                }
            } catch (Exception e) {
                logger.error("Error processing state parameter", e);
            }
        } else {
            logger.debug("No state parameter found in request");
        }
        
        filterChain.doFilter(request, response);
        logger.info("MobileRedirectFilter completed processing");
    }
}