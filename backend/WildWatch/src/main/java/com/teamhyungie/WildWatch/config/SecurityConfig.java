package com.teamhyungie.WildWatch.config;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextPersistenceFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.teamhyungie.WildWatch.security.CustomAuthorizationRequestResolver;
import com.teamhyungie.WildWatch.security.CustomOAuth2UserService;
import com.teamhyungie.WildWatch.security.JwtAuthenticationFilter;
import com.teamhyungie.WildWatch.security.MobileRedirectFilter;
import com.teamhyungie.WildWatch.security.OAuth2FailureHandler;
import com.teamhyungie.WildWatch.security.OAuth2SuccessHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final UserDetailsService userDetailsService;
    private final FrontendConfig frontendConfig;
    private final ClientRegistrationRepository clientRegistrationRepository;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            OAuth2SuccessHandler oAuth2SuccessHandler,
            OAuth2FailureHandler oAuth2FailureHandler,
            CustomOAuth2UserService customOAuth2UserService,
            UserDetailsService userDetailsService,
            FrontendConfig frontendConfig,
            ClientRegistrationRepository clientRegistrationRepository) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.oAuth2FailureHandler = oAuth2FailureHandler;
        this.customOAuth2UserService = customOAuth2UserService;
        this.userDetailsService = userDetailsService;
        this.frontendConfig = frontendConfig;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(authProvider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation().migrateSession()
                .maximumSessions(1)
                .expiredUrl("/login?expired"))
                .authorizeHttpRequests(auth -> auth
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/chatbot").permitAll()
                .requestMatchers("/ws/**").permitAll() // Allow WebSocket endpoints without auth
                .requestMatchers(
                        "/api/auth/**",
                        "/api/mobile/auth/**",
                        "/login/**",
                        "/oauth2/**",
                        "/error",
                        "/favicon.ico",
                        "/api/setup/**",
                        "/api/ping",
                        "/api/offices",
                        "/login/oauth2/code/microsoft",
                        // Swagger/OpenAPI endpoints
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/swagger-ui.html",
                        "/webjars/**")
                .permitAll()
                .requestMatchers("/api/terms/**").authenticated()
                .requestMatchers("/api/geolocation/**").authenticated()
                .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                .userService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
                .authorizationEndpoint(authorization -> authorization
                .authorizationRequestResolver(customAuthorizationRequestResolver())))
                .addFilterBefore(new MobileRedirectFilter(), SecurityContextPersistenceFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    // Add CORS headers before any response to prevent CORS errors
                    String origin = request.getHeader("Origin");
                    // Handle null origin for mobile apps (React Native/Expo may not send Origin header)
                    // Mobile apps don't need CORS headers since they're not browsers
                    if (origin != null && !origin.isEmpty() && !origin.equals("null")) {
                        // Only set CORS headers for web browsers with a valid origin
                        if (isOriginAllowed(origin)) {
                            response.setHeader("Access-Control-Allow-Origin", origin);
                            response.setHeader("Access-Control-Allow-Credentials", "true");
                            response.setHeader("Access-Control-Expose-Headers", "Location");
                        }
                    }
                    // For mobile apps without Origin header, we don't set CORS headers
                    // This is fine because mobile apps aren't subject to CORS restrictions

                    if (request.getHeader("Accept") != null
                            && request.getHeader("Accept").contains("application/json")) {
                        response.setStatus(401);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\":\"Unauthorized\"}");
                    } else {
                        String errorMessage = URLEncoder.encode(authException.getMessage(),
                                StandardCharsets.UTF_8);
                        String mobileRedirectUri = null;
                        String state = request.getParameter("state");
                        if (state != null && !state.isEmpty()) {
                            try {
                                String decoded = new String(Base64.getDecoder().decode(state),
                                        StandardCharsets.UTF_8);
                                if (decoded.contains("mobile_redirect_uri")) {
                                    int start = decoded.indexOf("mobile_redirect_uri") + 21;
                                    int end = decoded.indexOf('"', start);
                                    mobileRedirectUri = decoded.substring(start, end);
                                }
                            } catch (Exception e) {
                                // Log error but continue with web redirect
                            }
                        }
                        if (mobileRedirectUri != null && !mobileRedirectUri.isEmpty()) {
                            response.sendRedirect(mobileRedirectUri + "?error=" + errorMessage);
                        } else {
                            response.sendRedirect(
                                    frontendConfig.getActiveUrl() + "/auth/error?message=" + errorMessage);
                        }
                    }
                }));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Use origin patterns for flexible matching
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "https://jcldwuryjuqtrbsqlgoi.supabase.co",
                "https://*.onrender.com",
                "https://wildwatch.onrender.com",
                "https://*.vercel.app",
                "https://wild-watch.vercel.app",
                "https://wild-watch-cca16hidi-alec010s-projects.vercel.app",
                "wildwatchexpo://*", // Expo mobile app scheme
                "wildwatch://*")); // Legacy mobile app scheme
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList(
                "Set-Cookie",
                "Authorization",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Helper method to validate if an origin is allowed This is used by the
     * authentication entry point to set CORS headers
     */
    private boolean isOriginAllowed(String origin) {
        // Allow null origin for mobile apps (React Native/Expo apps may not send Origin header)
        if (origin == null || origin.equals("null")) {
            return true;
        }

        List<String> allowedPatterns = Arrays.asList(
                "http://localhost:3000",
                "https://jcldwuryjuqtrbsqlgoi.supabase.co",
                "https://wildwatch.onrender.com",
                "https://wild-watch.vercel.app",
                "https://wild-watch-cca16hidi-alec010s-projects.vercel.app");

        // Check exact matches first
        if (allowedPatterns.contains(origin)) {
            return true;
        }

        // Check pattern matches
        if (origin.matches("https://.*\\.onrender\\.com")) {
            return true;
        }
        if (origin.matches("https://.*\\.vercel\\.app")) {
            return true;
        }
        // Allow Expo mobile app scheme
        if (origin.startsWith("wildwatchexpo://")) {
            return true;
        }
        // Allow legacy mobile app scheme
        if (origin.startsWith("wildwatch://")) {
            return true;
        }

        return false;
    }

    @Bean
    public OAuth2AuthorizationRequestResolver customAuthorizationRequestResolver() {
        return new CustomAuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");
    }
}
