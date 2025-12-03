package com.teamhyungie.WildWatch.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class WebConfig implements WebMvcConfigurer {

    // CORS configuration removed - handled by SecurityConfig to avoid conflicts
    // Having duplicate CORS configurations can cause issues when credentials are involved
    // @Override
    // public void addCorsMappings(CorsRegistry registry) { ... }
}
