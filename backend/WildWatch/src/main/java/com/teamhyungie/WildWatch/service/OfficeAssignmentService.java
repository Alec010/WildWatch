package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.Office;
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
public class OfficeAssignmentService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent";
    private final RestTemplate restTemplate = new RestTemplate();

    public Office assignOffice(String description, String location, List<String> tags) {
        try {
            StringBuilder officeDescriptions = new StringBuilder();
            for (Office office : Office.values()) {
                officeDescriptions.append(office.name())
                        .append(" (")
                        .append(office.getFullName())
                        .append("): ")
                        .append(office.getDescription())
                        .append("\n\n");
            }

            String prompt = String.format(
                    "Analyze this incident report and determine the most appropriate office to handle it:\n\n" +
                    "Incident Description: '%s'\n" +
                    "Location: '%s'\n" +
                    "Tags: '%s'\n\n" +
                    "Available Offices:\n%s\n\n" +
                    "Consider the following factors:\n" +
                    "1. The nature and severity of the incident\n" +
                    "2. The location and context of the incident\n" +
                    "3. The specific responsibilities and expertise of each office\n" +
                    "4. The urgency and priority level of the incident\n\n" +
                    "Return ONLY the office code (e.g., HR, FO, MIS, etc.) that is best suited to handle this incident. " +
                    "Do not include any explanations or additional text.",
                    description,
                    location,
                    String.join(", ", tags),
                    officeDescriptions.toString());

            // Build Gemini API request body
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            // Add generation config to ensure consistent output
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.2); // Lower temperature for more consistent results
            generationConfig.put("candidateCount", 1);
            generationConfig.put("topK", 1); // Only consider the most likely response
            generationConfig.put("topP", 0.8); // Nucleus sampling for better quality
            requestBody.put("generationConfig", generationConfig);

            // Add safety settings to ensure appropriate responses
            Map<String, Object> safetySettings = new HashMap<>();
            safetySettings.put("category", "HARM_CATEGORY_HARASSMENT");
            safetySettings.put("threshold", "BLOCK_MEDIUM_AND_ABOVE");
            requestBody.put("safetySettings", Collections.singletonList(safetySettings));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = GEMINI_URL + "?key=" + apiKey;

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            // Parse the response
            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("candidates")) {
                log.error("Invalid response from Gemini API: {}", body);
                return Office.SSO; // Default to Student Success Office if there's an error
            }

            List candidates = (List) body.get("candidates");
            if (candidates.isEmpty()) {
                log.error("No candidates in Gemini API response");
                return Office.SSO;
            }

            Map firstCandidate = (Map) candidates.get(0);
            Map contentMap = (Map) firstCandidate.get("content");
            List parts = (List) contentMap.get("parts");
            if (parts.isEmpty()) {
                log.error("No parts in Gemini API response content");
                return Office.SSO;
            }

            Map responsePart = (Map) parts.get(0);
            String officeCode = ((String) responsePart.get("text")).trim();

            try {
                return Office.valueOf(officeCode);
            } catch (IllegalArgumentException e) {
                log.error("Invalid office code returned by Gemini API: {}", officeCode);
                return Office.SSO;
            }
        } catch (Exception e) {
            log.error("Error assigning office using Gemini API: ", e);
            return Office.SSO;
        }
    }
}