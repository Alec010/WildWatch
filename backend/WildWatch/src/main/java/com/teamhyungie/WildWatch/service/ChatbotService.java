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
public class ChatbotService {
    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_PRIMARY_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    private static final String GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private final RestTemplate restTemplate = new RestTemplate();

    public String chat(String userMessage) {
        try {
            if (apiKey == null || apiKey.trim().isEmpty()) {
                log.error("Gemini API key is not configured");
                return "AI service is not properly configured. Please contact support.";
            }

            String prompt = """
You are WildWatch's virtual assistant for Cebu Institute of Technology University (CIT-U). WildWatch is an incident reporting system used by students, staff, and faculty to report and track incidents that occur within the university campus.

In this context, an incident is any event or situation that affects the safety, security, discipline, facilities, or well-being of the CIT-U community. Examples include safety hazards, security concerns, disciplinary issues, facility problems, or any other event that should be reported to university authorities.

You are only allowed to answer questions about:
- What WildWatch is and how it works at CIT-U
- What an incident is (in the context of the university)
- How to report incidents, types of incidents, and the process
- The university offices involved in incident management (see list below)

Here are the offices and their descriptions:
Technical Service Group (TSG): Handles WiFi, network connectivity, computer equipment, and NGE Building laboratories. Manages network infrastructure, provides technical support, and maintains network equipment.
Office of the Property Custodian (OPC): Manages university property, assets, equipment, and campus grounds. Handles property inventory, asset tracking, procurement, disposal, and property-related incidents.
Student Success Office (SSO): Provides academic support, counseling, and student activities. Manages disciplinary matters and student records for student development and academic success.
Safety and Security Department (SSD): Ensures campus safety and security. Handles security incidents, safety hazards, theft reports, and threats. Manages security personnel, surveillance systems, access control, and parking.
Supreme Student Government (SSG): Official student governing body representing all students. Advocates for student rights and welfare. Organizes student activities and events. Concerns will be lobbied here if not in other offices.

If a user asks about anything outside these topics (such as IT system outages, general technology, or unrelated matters), politely respond:
"Sorry, I can only answer questions related to incident reporting, the offices involved, or the WildWatch system at Cebu Institute of Technology University. I do not cater to other topics."

User: 
""" + userMessage;

            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.5);
            generationConfig.put("candidateCount", 1);
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String primaryUrl = GEMINI_PRIMARY_URL + "?key=" + apiKey;
            String fallbackUrl = GEMINI_FALLBACK_URL + "?key=" + apiKey;
            log.debug("Making request to Gemini API: {} (with fallback)", primaryUrl);

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

            if (response.getStatusCode() != HttpStatus.OK) {
                log.error("Gemini API returned non-OK status: {}", response.getStatusCode());
                return "AI service error. Please try again later.";
            }

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("candidates")) {
                log.error("Invalid response from Gemini API: {}", body);
                return "AI service error. Please try again later.";
            }

            List candidates = (List) body.get("candidates");
            if (candidates.isEmpty()) {
                log.error("No candidates in Gemini API response");
                return "AI service error. Please try again later.";
            }

            Map firstCandidate = (Map) candidates.get(0);
            Map contentMap = (Map) firstCandidate.get("content");
            List parts = (List) contentMap.get("parts");
            if (parts.isEmpty()) {
                log.error("No parts in Gemini API response content");
                return "AI service error. Please try again later.";
            }

            Map responsePart = (Map) parts.get(0);
            String reply = ((String) responsePart.get("text")).trim();
            return reply;
        } catch (Exception e) {
            log.error("Error in Gemini chatbot: ", e);
            return "Server error. Please try again later.";
        }
    }
} 