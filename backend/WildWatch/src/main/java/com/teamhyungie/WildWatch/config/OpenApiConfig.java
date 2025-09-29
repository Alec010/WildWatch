package com.teamhyungie.WildWatch.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI wildWatchOpenAPI() {
        Server localServer = new Server()
                .url("http://localhost:" + serverPort)
                .description("Local development server");

        Server productionServer = new Server()
                .url("https://wildwatch-backend.onrender.com")
                .description("Production server");

        Contact contact = new Contact()
                .name("WildWatch Team")
                .email("support@wildwatch.com")
                .url("https://wildwatch.com");

        License license = new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");

        Info info = new Info()
                .title("WildWatch API")
                .description("WildWatch is a comprehensive incident reporting and management system designed for office environments. "
                        + "This API provides endpoints for user authentication, incident reporting, real-time notifications, "
                        + "and administrative functions.")
                .version("2.0.0")
                .contact(contact)
                .license(license);

        SecurityScheme bearerAuth = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Enter JWT token");

        SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList("bearerAuth");

        Components components = new Components()
                .addSecuritySchemes("bearerAuth", bearerAuth);

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer, productionServer))
                .components(components)
                .addSecurityItem(securityRequirement);
    }
}
