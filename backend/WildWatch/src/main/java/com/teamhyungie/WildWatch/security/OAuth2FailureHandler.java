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
import java.util.Base64;
import jakarta.servlet.http.HttpSession;

@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final FrontendConfig frontendConfig;

    public OAuth2FailureHandler(FrontendConfig frontendConfig) {
        this.frontendConfig = frontendConfig;
    }

    private String extractMobileRedirectUri(HttpServletRequest request) {
        // 1. Try session first
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object uri = session.getAttribute("mobile_redirect_uri");
            if (uri instanceof String && !((String) uri).isEmpty()) {
                return (String) uri;
            }
        }
        // 2. Try state parameter
        String state = request.getParameter("state");
        if (state != null && !state.isEmpty()) {
            try {
                String decoded = new String(Base64.getDecoder().decode(state), StandardCharsets.UTF_8);
                // Simple JSON parse (or use a library)
                if (decoded.contains("mobile_redirect_uri")) {
                    int start = decoded.indexOf("mobile_redirect_uri") + 21;
                    int end = decoded.indexOf('"', start);
                    return decoded.substring(start, end);
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String errorMessage = URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
        String mobileRedirectUri = extractMobileRedirectUri(request);
        String errorUrl;
        if (mobileRedirectUri != null && !mobileRedirectUri.isEmpty()) {
            errorUrl = mobileRedirectUri + "?error=" + errorMessage;
        } else {
            errorUrl = frontendConfig.getActiveUrl() + "/auth/error?error=" + errorMessage;
        }
        getRedirectStrategy().sendRedirect(request, response, errorUrl);
    }
} 