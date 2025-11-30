package com.teamhyungie.WildWatch.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModerationService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_PRIMARY_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    private static final String GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Result review(String incidentType, String description, String enhancedLocation, List<String> tags, List<String> officeNames) {
        try {
            // Use String concatenation instead of String.format to avoid format specifier issues
            // This allows users to include special characters like %, -, etc. in their descriptions
            String prompt = "You are a strict content moderator for a university incident reporting system.\n" +
                    "Decide whether to ALLOW or BLOCK a report BEFORE it is saved.\n" +
                    "BLOCK if ANY of the following apply:\n" +
                    "- Harassment, slurs, demeaning stereotypes, targeted insults, threats.\n" +
                    "- Rudeness/abuse without a legitimate incident description.\n" +
                    "- Disparagement/shaming/defamation directed at any university office (e.g., accusing or ridiculing an office, degrading its image or reputation) without constructive, factual reporting intent. The university offices include: " + 
                    (officeNames == null || officeNames.isEmpty() ? "[]" : officeNames.toString()) + ".\n" +
                    "- Calls to harm, doxx, or publicize staff.\n" +
                    "ALLOW when text is neutral, factual, or safety-focused even if it mentions offices neutrally.\n" +
                    "Inputs:\n- IncidentType: '" + safe(incidentType) + "'\n- Description: '" + safe(description) + 
                    "'\n- Location: '" + safe(enhancedLocation) + "'\n- Tags: " + (tags == null ? "[]" : tags.toString()) + "\n\n" +
                    "Return JSON with fields only: decision (ALLOW|BLOCK), confidence (0-1), reasons (array of short phrases such as 'harassment', 'hate-speech', 'office-disparagement'). No extra text.";

            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.0);
            generationConfig.put("candidateCount", 1);
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
                    response = restTemplate.exchange(fallbackUrl, HttpMethod.POST, entity, Map.class);
                }
            } catch (Exception ex) {
                response = restTemplate.exchange(fallbackUrl, HttpMethod.POST, entity, Map.class);
            }

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("candidates")) {
                return Result.allowFallback("Invalid response");
            }

            List candidates = (List) body.get("candidates");
            if (candidates.isEmpty()) {
                return Result.allowFallback("No candidates");
            }

            Map firstCandidate = (Map) candidates.get(0);
            Map contentMap = (Map) firstCandidate.get("content");
            List parts = (List) contentMap.get("parts");
            if (parts.isEmpty()) {
                return Result.allowFallback("No content parts");
            }

            Map responsePart = (Map) parts.get(0);
            String text = ((String) responsePart.get("text")).trim();

            // Try to parse strict JSON; strip markdown fences if present
            try {
                String json = text
                        .replaceAll("^```(json)?\\s*", "")
                        .replaceAll("```$", "")
                        .trim();
                int start = json.indexOf('{');
                int end = json.lastIndexOf('}');
                if (start >= 0 && end > start) {
                    json = json.substring(start, end + 1);
                }

                Map<?, ?> parsed = objectMapper.readValue(json, Map.class);
                Object d = parsed.get("decision");
                Decision decision = (d != null && d.toString().equalsIgnoreCase("BLOCK")) ? Decision.BLOCK : Decision.ALLOW;
                double confidence = 0.5;
                Object c = parsed.get("confidence");
                if (c instanceof Number) confidence = Math.min(1.0, Math.max(0.0, ((Number) c).doubleValue()));
                else if (c != null) {
                    try { confidence = Double.parseDouble(c.toString()); } catch (Exception ignore) {}
                }
                List<String> reasons = new ArrayList<>();
                Object r = parsed.get("reasons");
                if (r instanceof Collection<?>) {
                    for (Object o : (Collection<?>) r) {
                        if (o != null) reasons.add(o.toString());
                    }
                }
                return new Result(decision, confidence, reasons.isEmpty() ? List.of("moderation-complete") : reasons);
            } catch (Exception parseEx) {
                log.warn("Moderation JSON parse failed; falling back. Raw: {}", text);
                return Result.allowFallback("parse-error");
            }
        } catch (Exception e) {
            log.error("Moderation error", e);
            return Result.allowFallback("exception");
        }
    }

    private String safe(String s) { return s == null ? "" : s; }

    public enum Decision { ALLOW, BLOCK }

    public static class Result {
        public final Decision decision;
        public final double confidence;
        public final List<String> reasons;

        public Result(Decision decision, double confidence, List<String> reasons) {
            this.decision = decision;
            this.confidence = confidence;
            this.reasons = reasons;
        }

        public static Result allowFallback(String reason) {
            return new Result(Decision.ALLOW, 0.3, List.of(reason));
        }
    }
}


