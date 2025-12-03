package com.teamhyungie.WildWatch.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    // EHCache configuration is loaded from ehcache.xml
    // Spring Boot will auto-configure the cache manager based on the ehcache.xml file
}