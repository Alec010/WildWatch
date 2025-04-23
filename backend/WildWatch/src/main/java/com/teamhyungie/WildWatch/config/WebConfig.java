package com.teamhyungie.WildWatch.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final Logger logger = LoggerFactory.getLogger(WebConfig.class);

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Get the current working directory (WildWatch)
        File currentDir = new File(System.getProperty("user.dir"));
        // The uploads directory is at the same level
        File uploadsDir = new File(currentDir, "uploads");
        String uploadsAbsolutePath = uploadsDir.getAbsolutePath();
        
        logger.info("Configuring uploads directory at: " + uploadsAbsolutePath);
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadsAbsolutePath + "/")
                .setCachePeriod(3600);
                
        logger.info("Resource handler configured for pattern /uploads/** -> " + "file:" + uploadsAbsolutePath + "/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/uploads/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
} 