package com.teamhyungie.WildWatch.security;

import com.teamhyungie.WildWatch.config.FrontendConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final FrontendConfig frontendConfig;

    public OAuth2FailureHandler(FrontendConfig frontendConfig) {
        this.frontendConfig = frontendConfig;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String errorUrl = frontendConfig.getActiveUrl() + "/auth/error?error=" + 
            URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
        getRedirectStrategy().sendRedirect(request, response, errorUrl);
    }
} 