package com.teamhyungie.WildWatch.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        // Configure timeouts for faster failure handling
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // Connection timeout: 5 seconds
        factory.setReadTimeout(30000); // Read/Response timeout: 30 seconds
        
        RestTemplate restTemplate = new RestTemplate(factory);
        
        // Note: For connection pooling, you would need Apache HttpClient dependency:
        // <dependency>
        //     <groupId>org.apache.httpcomponents.client5</groupId>
        //     <artifactId>httpclient5</artifactId>
        // </dependency>
        // Then use HttpComponentsClientHttpRequestFactory with PoolingHttpClientConnectionManager
        
        return restTemplate;
    }
}
















