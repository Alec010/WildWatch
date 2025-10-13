package com.teamhyungie.WildWatch.config;

import com.teamhyungie.WildWatch.service.BadgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;

/**
 * Configuration for badge system
 */
@Configuration
public class BadgeConfig {

    @Autowired
    private BadgeService badgeService;

    /**
     * Initialize badge system when application starts
     */
    @EventListener(ContextRefreshedEvent.class)
    public void initializeBadges() {
        badgeService.initializeDefaultBadges();
    }
}




