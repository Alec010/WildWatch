package com.teamhyungie.WildWatch.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final Logger logger = LoggerFactory.getLogger(WebConfig.class);

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(
                    "http://localhost:3000",
                    "http://localhost:*",
                    "http://192.168.1.11:*",
                    "exp://192.168.1.11:*",
                    "exp://localhost:*",
                    "https://jcldwuryjuqtrbsqlgoi.supabase.co",
                    "https://*.onrender.com",
                    "https://wildwatch.onrender.com",
                    "https://*.vercel.app",
                    "https://wild-watch-cca16hidi-alec010s-projects.vercel.app"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
} 