package com.teamhyungie.WildWatch.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TagGenerationService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_PRIMARY_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    private static final String GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    private final RestTemplate restTemplate = new RestTemplate();

    public List<String> generateTags(String description, String location, String incidentType) {
        try {
            String prompt = String.format(
                "You are classifying an incident into tags.\n" +
                "Input:\n" +
                "- Incident Type: '%s'\n" +
                "- Description: '%s'\n" +
                "- Location: '%s'\n" +
                "Task:\n" +
                "- Generate EXACTLY 15 highly relevant tags that capture: (a) incident context, (b) parties involved, (c) severity/urgency if clear, (d) location identifiers.\n" +
                "- MANDATORY: If the location contains building identifiers/codes or acronyms (e.g., 'GLE', 'MIS'), include each such exact token as its own tag.\n" +
                "- If date/time expressions appear in the description (e.g., 'Sept 23, 10:30 AM'), include normalized time/date tags when unambiguous (e.g., '2025-09-23', '10:30').\n" +
                "- DO NOT add external campuses, cities, or countries that are not explicitly present in the input. Prefer on-campus identifiers over broad geography.\n" +
                "- Return ONLY the tags as a comma-separated list, no numbering or extra text.\n" +
                "- Each tag should be a single word or a short hyphenated phrase.\n" +
                "- Output format: tag1, tag2, tag3, ..., tag15",
                incidentType == null ? "" : incidentType,
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

            // Filter out irrelevant external campuses/cities not present in input
            Set<String> disallowedExact = new HashSet<>(Arrays.asList(
                "University-of-San-Carlos", "USC", "Talamban-Campus"
            ));

            String inputConcat = ((incidentType == null ? "" : incidentType) + " " + (description == null ? "" : description) + " " + (location == null ? "" : location)).toLowerCase();
            List<String> geoIndicators = Arrays.asList("city", "campus", "university", "province", "philippines", "barangay", "street", "avenue", "road", "highway", "country");

            // Hard filters for granular address tokens we never want as tags
            Pattern plusCodePattern = Pattern.compile("^[2-9A-Z]{4}\\+[2-9A-Z]{2,3}$");
            Pattern numericOnlyPattern = Pattern.compile("^\\d{4,6}$"); // postal codes like 6000
            Set<String> geoStopwords = new HashSet<>(Arrays.asList(
                "philippines", "cebu", "cebu-city"
            ));

            List<String> cleanedGenerated = new ArrayList<>();
            for (String t : generatedTags) {
                String slug = t.replace(" ", "-");
                if (disallowedExact.contains(slug)) {
                    continue;
                }
                String lower = t.toLowerCase();
                if (geoStopwords.contains(lower)) {
                    continue; // Always drop broad geo names
                }
                if (plusCodePattern.matcher(t).matches()) {
                    continue; // Drop Plus Codes like 7VWJ+3HR
                }
                if (numericOnlyPattern.matcher(t).matches()) {
                    continue; // Drop standalone postal codes like 6000
                }
                boolean looksGeo = geoIndicators.stream().anyMatch(lower::contains);
                if (looksGeo && !inputConcat.contains(lower)) {
                    // Skip geo-like tag that doesn't appear in the original input
                    continue;
                }
                cleanedGenerated.add(t);
            }

            // Post-process to ensure building/location codes are present (e.g., GLE, GLE-202)
            List<String> mandatoryLocationTokens = new ArrayList<>();
            Set<String> acronymStoplist = new HashSet<>(Arrays.asList("CR", "AM", "PM"));

            String safeLocation = location == null ? "" : location;
            String safeDescription = description == null ? "" : description;

            // 1) Extract patterns like GLE202 / GLE-202 from location and description, normalize to GLE-202
            Pattern buildingRoomPattern = Pattern.compile("\\b([A-Z]{2,})[- ]?(\\d{1,4})\\b");
            for (String source : Arrays.asList(safeLocation, safeDescription)) {
                Matcher m = buildingRoomPattern.matcher(source);
                while (m.find()) {
                    String building = m.group(1);
                    String room = m.group(2);
                    if (!acronymStoplist.contains(building)) {
                        String normalized = building + "-" + room;
                        mandatoryLocationTokens.add(building);
                        mandatoryLocationTokens.add(normalized);
                    }
                }
            }

            // 2) Force include building code/name tokens like "GLE" and "GLE-Building"
            Pattern buildingNamePattern = Pattern.compile("\\b([A-Z]{2,})\\s+Building\\b", Pattern.CASE_INSENSITIVE);
            Matcher nameMatcher = buildingNamePattern.matcher(safeLocation);
            while (nameMatcher.find()) {
                String code = nameMatcher.group(1).toUpperCase();
                if (!acronymStoplist.contains(code)) {
                    mandatoryLocationTokens.add(code);
                    mandatoryLocationTokens.add(code + "-Building");
                }
            }

            // 3) Extract standalone acronyms from location if they likely denote a building
            Pattern acronymPattern = Pattern.compile("\\b[A-Z]{2,}\\b");
            Matcher acronymMatcher = acronymPattern.matcher(safeLocation);
            while (acronymMatcher.find()) {
                String token = acronymMatcher.group();
                if (acronymStoplist.contains(token)) continue;
                // Heuristic: keep if 'TOKEN building' appears in location or TOKEN appears with digits in description/location
                boolean seemsBuilding = safeLocation.toLowerCase().contains((token + " building").toLowerCase())
                        || buildingRoomPattern.matcher(safeDescription).reset().find()
                        || buildingRoomPattern.matcher(safeLocation).reset().find();
                if (seemsBuilding) {
                    mandatoryLocationTokens.add(token);
                }
            }

            // Balance: separate location-like tags from content tags
            // Heuristics for location: present in mandatory tokens OR matches geo indicators/building patterns
            Pattern buildingRoomPattern2 = Pattern.compile("\\b([A-Z]{2,})[- ]?(\\d{1,4})\\b");
            Set<String> mergedOrderedSet = new LinkedHashSet<>();
            // preserve input order: mandatory first, then generated
            mandatoryLocationTokens.forEach(mergedOrderedSet::add);
            cleanedGenerated.forEach(mergedOrderedSet::add);

            List<String> locationCandidates = new ArrayList<>();
            List<String> contentCandidates = new ArrayList<>();
            for (String t : mergedOrderedSet) {
                String lower = t.toLowerCase();
                boolean isLoc = mandatoryLocationTokens.contains(t)
                        || geoIndicators.stream().anyMatch(lower::contains)
                        || buildingRoomPattern2.matcher(t).find()
                        || lower.contains("building");
                if (isLoc) locationCandidates.add(t); else contentCandidates.add(t);
            }

            // Build top 5 to be balanced: 2-3 location and 2-3 content
            List<String> topFive = new ArrayList<>();
            int locQuota = Math.min(3, locationCandidates.size());
            int contentQuota = Math.min(3, contentCandidates.size());
            // Ensure total 5; prefer 2 loc + 3 content if content is rich, else 3 loc + 2 content
            int desiredLoc = contentCandidates.size() >= 3 ? Math.min(2, locQuota) : Math.min(3, locQuota);
            int desiredContent = 5 - desiredLoc;
            for (int i = 0; i < desiredLoc && i < locationCandidates.size(); i++) topFive.add(locationCandidates.get(i));
            for (int i = 0; i < desiredContent && i < contentCandidates.size(); i++) topFive.add(contentCandidates.get(i));

            // Compose final list up to 15: prioritized balanced topFive, then remaining content, then remaining location
            LinkedHashSet<String> finalOrdered = new LinkedHashSet<>();
            topFive.forEach(finalOrdered::add);
            for (int i = desiredContent; i < contentCandidates.size(); i++) finalOrdered.add(contentCandidates.get(i));
            for (int i = desiredLoc; i < locationCandidates.size(); i++) finalOrdered.add(locationCandidates.get(i));

            List<String> finalTags = new ArrayList<>(15);
            for (String t : finalOrdered) {
                if (finalTags.size() >= 15) break;
                finalTags.add(t);
            }

            if (finalTags.size() != 15) {
                log.warn("Generated {} tags after enforcement (expected 15)", finalTags.size());
            }

            return finalTags;
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