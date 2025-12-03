package com.teamhyungie.WildWatch.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Bean
    public TaskScheduler customMessageBrokerTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("websocket-heartbeat-thread-");
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[]{120000, 120000}) // Set heartbeat to 120 seconds (much less frequent)
                .setTaskScheduler(customMessageBrokerTaskScheduler());
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        "http://localhost:3000",
                        "https://jcldwuryjuqtrbsqlgoi.supabase.co",
                        "https://*.onrender.com",
                        "https://wildwatch.onrender.com",
                        "https://*.vercel.app",
                        "https://wild-watch.vercel.app",
                        "https://wild-watch-cca16hidi-alec010s-projects.vercel.app",
                        "wildwatchexpo://*", // Expo mobile app scheme
                        "wildwatch://*" // Legacy mobile app scheme
                )
                .withSockJS()
                .setHeartbeatTime(120000) // Set SockJS heartbeat to 120 seconds
                .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js")
                .setSessionCookieNeeded(false);
    }
}
