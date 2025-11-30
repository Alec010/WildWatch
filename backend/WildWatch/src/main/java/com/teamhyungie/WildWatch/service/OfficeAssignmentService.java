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

    private static final String GEMINI_PRIMARY_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private static final String GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    private final RestTemplate restTemplate; // Injected via constructor

    public Office assignOffice(String description, String location, List<String> tags) {
        // Try primary model (Flash) first
        Office result = tryAssignWithModel(description, location, tags, GEMINI_PRIMARY_URL, "Flash");
        if (result != null) {
            return result;
        }
        
        // If primary fails, try fallback model (Pro)
        log.warn("Primary model (Flash) failed, attempting fallback model (Pro)...");
        result = tryAssignWithModel(description, location, tags, GEMINI_FALLBACK_URL, "Pro");
        if (result != null) {
            return result;
        }
        
        // Only use keyword fallback as last resort
        log.error("Both AI models failed, using keyword-based fallback");
        return fallbackOfficeAssignment(description, tags);
    }
    
    private Office tryAssignWithModel(String description, String location, List<String> tags, String modelUrl, String modelName) {
        try {
            // Limit description length to avoid excessive tokens
            String truncatedDescription = description.length() > 500 
                    ? description.substring(0, 500) + "..." 
                    : description;
            
            // Use all 20 tags for better context in office assignment
            List<String> relevantTags = tags;
            
            // Simplify location (remove redundant concatenation)
            String simplifiedLocation = location.length() > 200 
                    ? location.substring(0, 200) + "..." 
                    : location;
            
            StringBuilder officeDescriptions = new StringBuilder();
            for (Office office : Office.values()) {
                officeDescriptions.append(office.name())
                        .append(": ")
                        .append(office.getDescription())
                        .append("\n");
            }

            // Use String concatenation instead of String.format to avoid format specifier issues
            // This allows users to include special characters like %, -, etc. in their descriptions
            String prompt = "Assign this incident to the correct office code.\n\n" +
                    "Description: " + truncatedDescription + "\n" +
                    "Location: " + simplifiedLocation + "\n" +
                    "Tags: " + String.join(", ", relevantTags) + "\n\n" +
                    "CRITICAL RULES (FOLLOW IN ORDER - STOP AT FIRST MATCH):\n" +
                    "1. NGE Building (any mention of NGE) + computer/keyboard/mouse/USB/monitor/lab equipment → TSG\n" +
                    "2. NGE Building rooms (NGE102, NGE203, NGE1XX, NGE2XX, etc.) → TSG (computer labs)\n" +
                    "3. WiFi/network/internet/computer/technical issues (anywhere on campus) → TSG\n" +
                    "4. Student fights/bullying/misbehavior/conflicts/disciplinary → SSO\n" +
                    "5. Parking/car/vehicle issues → SSD\n" +
                    "6. Theft/robbery/external threats/security → SSD\n" +
                    "7. Non-computer property/equipment/grounds/facilities (NOT in NGE, NOT computers) → OPC\n" +
                    "8. Academic support/counseling/student records → SSO\n" +
                    "9. Student advocacy/student welfare → SSG\n\n" +
                    "KEY DISTINCTIONS:\n" +
                    "- NGE + computer equipment = TSG (NOT OPC)\n" +
                    "- Computer/technical anywhere = TSG (NOT OPC)\n" +
                    "- Physical property/buildings (non-computer) = OPC\n" +
                    "- Student-on-student incidents = SSO\n" +
                    "- External threats or theft = SSD\n\n" +
                    "Offices:\n" + officeDescriptions.toString() + "\n" +
                    "Return ONLY: TSG, OPC, SSO, SSD, or SSG";
            
            log.debug("Attempting office assignment with {} model", modelName);

            // Build Gemini API request body
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            // Generous token config for free tier (no cost concerns)
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.0);
            generationConfig.put("candidateCount", 1);
            generationConfig.put("maxOutputTokens", 500); // High limit to avoid MAX_TOKENS errors
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = modelUrl + "?key=" + apiKey;
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            // Parse the response
            Map<String, Object> body = response.getBody();
            if (body == null) {
                log.error("{} model: Null response body", modelName);
                return null;
            }
            
            // Log the full response for debugging
            log.debug("{} model response: {}", modelName, body);
            
            // Check for API errors
            if (body.containsKey("error")) {
                log.error("{} model API error: {}", modelName, body.get("error"));
                return null;
            }
            
            if (!body.containsKey("candidates")) {
                log.error("{} model: No candidates in response", modelName);
                return null;
            }

            List candidates = (List) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                log.error("{} model: Empty or null candidates list", modelName);
                return null;
            }

            Map firstCandidate = (Map) candidates.get(0);
            if (firstCandidate == null || !firstCandidate.containsKey("content")) {
                log.error("{} model: First candidate is null or missing content", modelName);
                return null;
            }
            
            // Check if response was cut off due to MAX_TOKENS
            String finishReason = (String) firstCandidate.get("finishReason");
            if ("MAX_TOKENS".equals(finishReason)) {
                log.warn("{} model hit MAX_TOKENS limit, trying next fallback", modelName);
                return null;
            }
            
            Map contentMap = (Map) firstCandidate.get("content");
            if (contentMap == null || !contentMap.containsKey("parts")) {
                log.error("{} model: Content map is null or missing parts", modelName);
                return null;
            }
            
            List parts = (List) contentMap.get("parts");
            if (parts == null || parts.isEmpty()) {
                log.error("{} model: Parts list is null or empty", modelName);
                return null;
            }

            Map responsePart = (Map) parts.get(0);
            if (responsePart == null || !responsePart.containsKey("text")) {
                log.error("{} model: Response part is null or missing text", modelName);
                return null;
            }
            
            String officeCode = ((String) responsePart.get("text")).trim();
            
            try {
                Office assignedOffice = Office.valueOf(officeCode);
                log.info("Assigned to office: {} ({})", assignedOffice, modelName);
                return assignedOffice;
            } catch (IllegalArgumentException e) {
                log.error("{} model returned invalid office code: {}", modelName, officeCode);
                return null;
            }
        } catch (Exception e) {
            log.error("Error with {} model: {}", modelName, e.getMessage());
            return null;
        }
    }
    
    /**
     * Fallback office assignment based on simple tag/keyword matching
     * Used when Gemini API fails
     */
    private Office fallbackOfficeAssignment(String description, List<String> tags) {
        log.warn("Using fallback office assignment logic");
        
        String combinedText = (description + " " + String.join(" ", tags)).toLowerCase();
        
        // Priority 1: NGE + computer/tech equipment (keyboard, mouse, USB, monitor, PC, computer)
        if (combinedText.contains("nge") && 
            (combinedText.contains("computer") || combinedText.contains("keyboard") || 
             combinedText.contains("mouse") || combinedText.contains("usb") || 
             combinedText.contains("monitor") || combinedText.contains("pc") || 
             combinedText.contains("lab") || combinedText.contains("tech"))) {
            log.info("Fallback: Assigned to TSG (NGE + computer equipment)");
            return Office.TSG;
        }
        
        // Priority 2: NGE Building computer lab rooms (NGE1XX or NGE2XX)
        if (combinedText.matches(".*nge\\s*[12]\\d{2}.*") || 
            tags.stream().anyMatch(t -> t.matches("(?i)nge[12]\\d{2}"))) {
            log.info("Fallback: Assigned to TSG (NGE computer lab room detected)");
            return Office.TSG;
        }
        
        // Priority 3: WiFi/network/computer/technical (anywhere on campus)
        if (combinedText.contains("wifi") || combinedText.contains("network") || 
            combinedText.contains("internet") || combinedText.contains("computer") ||
            combinedText.contains("keyboard") || combinedText.contains("mouse") ||
            combinedText.contains("usb") || combinedText.contains("technical")) {
            log.info("Fallback: Assigned to TSG (tech detected)");
            return Office.TSG;
        }
        
        // Priority 4: Parking/car/vehicle keywords
        if (combinedText.contains("parking") || combinedText.contains("car") || 
            combinedText.contains("vehicle") || tags.stream().anyMatch(t -> 
                t.equalsIgnoreCase("Parking") || t.equalsIgnoreCase("Car") || t.equalsIgnoreCase("Vehicle"))) {
            log.info("Fallback: Assigned to SSD (parking/car/vehicle detected)");
            return Office.SSD;
        }
        
        // Priority 5: Security/safety keywords
        if (combinedText.contains("theft") || combinedText.contains("security") || 
            combinedText.contains("safety") || combinedText.contains("stolen")) {
            log.info("Fallback: Assigned to SSD (security/safety detected)");
            return Office.SSD;
        }
        
        // Priority 6: Property keywords (non-computer equipment)
        if (combinedText.contains("property") || combinedText.contains("asset") || 
            combinedText.contains("equipment") || combinedText.contains("grounds")) {
            log.info("Fallback: Assigned to OPC (property detected)");
            return Office.OPC;
        }
        
        // Default to SSG for general concerns
        log.info("Fallback: Assigned to SSG (default)");
        return Office.SSG;
    }
}