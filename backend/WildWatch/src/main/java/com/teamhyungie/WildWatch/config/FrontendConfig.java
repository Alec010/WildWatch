package com.teamhyungie.WildWatch.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FrontendConfig {
    
    @Value("${frontend.url}")
    private String frontendUrl;
    
    @Value("${frontend.production-url}")
    private String productionUrl;
    
    public String getFrontendUrl() {
        return frontendUrl;
    }
    
    public String getProductionUrl() {
        return productionUrl;
    }
    
    public String getActiveUrl() {
        // If FRONTEND_URL is set to production URL, use it, otherwise use the default frontend URL
        return frontendUrl.equals(productionUrl) ? productionUrl : frontendUrl;
    }
} 