package com.teamhyungie.WildWatch.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
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
        Server devServer = new Server();
        devServer.setUrl("http://localhost:" + serverPort);
        devServer.setDescription("Development Server");

        Server prodServer = new Server();
        prodServer.setUrl("https://wildwatch-production.onrender.com");
        prodServer.setDescription("Production Server");

        Contact contact = new Contact();
        contact.setEmail("arelaalec@gmail.com");
        contact.setName("WildWatch Team");

        License mitLicense = new License()
                .name("MIT License")
                .url("https://choosealicense.com/licenses/mit/");

        Info info = new Info()
                .title("WildWatch API")
                .version("1.0.0")
                .contact(contact)
                .description("API documentation for WildWatch - Wildlife Incident Reporting System")
                .termsOfService("https://wildwatch.com/terms")
                .license(mitLicense);

        return new OpenAPI()
                .info(info)
                .servers(List.of(devServer, prodServer));
    }
}