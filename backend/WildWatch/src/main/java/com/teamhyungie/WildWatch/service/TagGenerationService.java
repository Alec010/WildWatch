package com.teamhyungie.WildWatch.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TagGenerationService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent";

    private final RestTemplate restTemplate = new RestTemplate();

    public List<String> generateTags(String description, String location) {
        try {
            String prompt = String.format(
                "Based on this incident description: '%s' and location: '%s', " +
                "generate EXACTLY 15 relevant tags that categorize this incident. " +
                "Return ONLY the tags as a comma-separated list. " +
                "Each tag should be a single word or hyphenated phrase. " +
                "You MUST generate EXACTLY 15 unique and relevant tags, no more and no less. " +
                "Format: tag1, tag2, tag3, ..., tag15 " +
                "Do not include any explanations, numbering, or additional text.",
                description, location
            );

            // Build Gemini API request body
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));
            
            // Add generation config to ensure consistent output
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("candidateCount", 1);
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = GEMINI_URL + "?key=" + apiKey;

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            // Parse the response
            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("candidates")) {
                log.error("Invalid response from Gemini API: {}", body);
                return List.of();
            }

            List candidates = (List) body.get("candidates");
            if (candidates.isEmpty()) {
                log.error("No candidates in Gemini API response");
                return List.of();
            }

            Map firstCandidate = (Map) candidates.get(0);
            Map contentMap = (Map) firstCandidate.get("content");
            List parts = (List) contentMap.get("parts");
            if (parts.isEmpty()) {
                log.error("No parts in Gemini API response content");
                return List.of();
            }

            Map responsePart = (Map) parts.get(0);
            String tagsText = ((String) responsePart.get("text")).trim();

            List<String> generatedTags = Arrays.stream(tagsText.split(","))
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .collect(Collectors.toList());

            // Ensure exactly 15 tags
            if (generatedTags.size() != 15) {
                log.warn("Generated {} tags instead of 15", generatedTags.size());
            }

            return generatedTags;
        } catch (Exception e) {
            log.error("Error generating tags from Gemini API: ", e);
            
            // Check if API key is configured
            if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${GEMINI_API_KEY}")) {
                log.error("Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.");
                throw new RuntimeException("AI service not configured. Please contact administrator.");
            }
            
            // Log more specific error details
            log.error("Gemini API Error Details: {}", e.getMessage());
            throw new RuntimeException("Failed to generate tags: " + e.getMessage());
        }
    }
} 