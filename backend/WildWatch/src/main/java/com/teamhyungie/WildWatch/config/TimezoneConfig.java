package com.teamhyungie.WildWatch.config;

import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Configuration class for application timezone.
 * All dates and times in the application use UTC+8 (Asia/Singapore timezone).
 */
public class TimezoneConfig {
    
    /**
     * Application timezone: UTC+8 (Asia/Singapore)
     */
    public static final ZoneId APP_TIMEZONE = ZoneId.of("Asia/Singapore");
    
    /**
     * Application timezone offset: UTC+8
     */
    public static final ZoneOffset APP_ZONE_OFFSET = ZoneOffset.ofHours(8);
    
    private TimezoneConfig() {
        // Utility class - prevent instantiation
    }
}

