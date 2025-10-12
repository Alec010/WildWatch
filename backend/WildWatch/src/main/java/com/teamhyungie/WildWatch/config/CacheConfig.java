package com.teamhyungie.WildWatch.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    // EHCache configuration is loaded from ehcache.xml
}