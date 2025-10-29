package com.teamhyungie.WildWatch.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.TimeZone;

@Configuration
public class DateTimeConfig {

    private static final DateTimeFormatter ISO_OFFSET_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    @PostConstruct
    public void init() {
        // Ensure the JVM runs in UTC so LocalDateTime.now() is consistent across environments
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    @Bean
    public ObjectMapper objectMapper(ObjectMapper base) {
        // Configure Jackson to serialize LocalDateTime with an explicit UTC offset ("Z")
        JavaTimeModule javaTimeModule = new JavaTimeModule();

        // Serialize LocalDateTime as ISO_OFFSET_DATE_TIME with Z suffix by assuming UTC
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(ISO_OFFSET_FORMATTER) {
        });

        // Deserialize strings with offsets back to LocalDateTime in UTC
        javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(ISO_OFFSET_FORMATTER) {
        });

        SimpleModule module = new SimpleModule();
        base.registerModule(javaTimeModule);
        base.registerModule(module);
        return base;
    }
}


