package com.teamhyungie.WildWatch.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentClassificationService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_PRIMARY_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    private static final String GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Determines if the report is a real incident or just a concern.
     * Uses only incident type and description (not tags) for classification.
     * 
     * @param incidentType The type of incident reported
     * @param description The description of the incident
     * @return true if it's a real incident, false if it's just a concern
     */
    public boolean isRealIncident(String incidentType, String description) {
        try {
            String prompt = String.format(
                    "Analyze this report and determine if it is a REAL INCIDENT or just a CONCERN:\n\n" +
                    "Incident Type: '%s'\n" +
                    "Description: '%s'\n\n" +
                    "A REAL INCIDENT is:\n" +
                    "- An actual event that occurred (theft, vandalism, harassment, safety hazard, etc.)\n" +
                    "- Something that requires immediate action or investigation\n" +
                    "- A specific occurrence with details about what happened\n" +
                    "- A violation of rules, safety, or security\n\n" +
                    "A CONCERN is:\n" +
                    "- A general question or inquiry\n" +
                    "- A suggestion or feedback without a specific incident\n" +
                    "- A complaint about services without a specific event\n" +
                    "- A request for information\n" +
                    "- A general observation without a specific incident\n\n" +
                    "Return ONLY 'true' if it's a REAL INCIDENT, or 'false' if it's just a CONCERN. " +
                    "Do not include any explanations or additional text.",
                    safe(incidentType),
                    safe(description)
            );

            // Build Gemini API request body
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            // Add generation config for consistent output
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.1); // Low temperature for consistent boolean output
            generationConfig.put("candidateCount", 1);
            generationConfig.put("topK", 1);
            generationConfig.put("topP", 0.8);
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String primaryUrl = GEMINI_PRIMARY_URL + "?key=" + apiKey;
            String fallbackUrl = GEMINI_FALLBACK_URL + "?key=" + apiKey;

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response;
            try {
                response = restTemplate.exchange(primaryUrl, HttpMethod.POST, entity, Map.class);
                if (response.getStatusCode() != HttpStatus.OK) {
                    log.warn("Gemini primary model returned status {} - attempting fallback", response.getStatusCode());
                    response = restTemplate.exchange(fallbackUrl, HttpMethod.POST, entity, Map.class);
                }
            } catch (Exception ex) {
                log.warn("Gemini primary model failed ({}). Attempting fallback...", ex.getMessage());
                response = restTemplate.exchange(fallbackUrl, HttpMethod.POST, entity, Map.class);
            }

            // Parse the response
            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("candidates")) {
                log.error("Invalid response from Gemini API: {}", body);
                return true; // Default to true (treat as incident) if there's an error
            }

            List candidates = (List) body.get("candidates");
            if (candidates.isEmpty()) {
                log.error("No candidates in Gemini API response");
                return true; // Default to true
            }

            Map firstCandidate = (Map) candidates.get(0);
            Map contentMap = (Map) firstCandidate.get("content");
            List parts = (List) contentMap.get("parts");
            if (parts.isEmpty()) {
                log.error("No parts in Gemini API response content");
                return true; // Default to true
            }

            Map responsePart = (Map) parts.get(0);
            String result = ((String) responsePart.get("text")).trim().toLowerCase();

            // Parse boolean response
            if (result.contains("true") || result.equals("true")) {
                return true;
            } else if (result.contains("false") || result.equals("false")) {
                return false;
            } else {
                log.warn("Unexpected response from Gemini API: {}. Defaulting to true.", result);
                return true; // Default to true if response is unclear
            }
        } catch (Exception e) {
            log.error("Error classifying incident using Gemini API: ", e);
            return true; // Default to true (treat as incident) on error
        }
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }
}

