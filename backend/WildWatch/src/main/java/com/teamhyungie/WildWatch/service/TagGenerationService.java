package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.TagScore;
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

    /**
     * Removes plus codes (e.g., "7VWJ+3HR") from location string before sending
     * to AI
     */
    private String removePlusCodes(String location) {
        if (location == null || location.isEmpty()) {
            return location;
        }
        // Pattern to match plus codes anywhere in the string
        Pattern plusCodePattern = Pattern.compile("\\b[2-9A-Z]{4}\\+[2-9A-Z]{2,3}\\b");
        return plusCodePattern.matcher(location).replaceAll("").trim().replaceAll("\\s+", " ");
    }

    public List<String> generateTags(String description, String location, String incidentType) {
        try {
            // Sanitize location by removing plus codes before sending to AI
            String sanitizedLocation = removePlusCodes(location);

            String formatString = "You are classifying an incident into tags.\n"
                    + "Input:\n"
                    + "- Incident Type: '%s'\n"
                    + "- Description: '%s'\n"
                    + "- Location: '%s'\n"
                    + "Task:\n"
                    + "- Generate EXACTLY 20 highly relevant tags that capture: (a) incident context, (b) parties involved, (c) severity/urgency if clear, (d) location identifiers. (e) impact or effect\n"
                    + "- MANDATORY: If the location contains building identifiers or acronyms (e.g., 'GLE', 'MIS'), include each such exact token as its own tag.\n"
                    + "- DO NOT include date or time tags (e.g., '2025-09-23', '10:30', dates, times). Focus only on contextual, location, and incident-related tags.\n"
                    + "- DO NOT add external campuses, cities, or countries that are not explicitly present in the input. Prefer on-campus identifiers over broad geography.\n"
                    + "- Return ONLY the tags as a comma-separated list, no numbering or extra text.\n"
                    + "- Each tag should be a single word or a short hyphenated phrase in sentence case (first letter capitalized, rest lowercase).\n"
                    + "- Avoid duplicates and avoid generic single-word tags like 'Issue' or 'Problem' on their own; they are acceptable only in specific phrases.\n"
                    + "- Output format: tag1, tag2, tag3, ..., tag20";
            String prompt = String.format(formatString,
                    incidentType == null ? "" : incidentType,
                    description == null ? "" : description,
                    sanitizedLocation
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

            // Patterns to detect date/time tags
            Pattern datePattern = Pattern.compile("\\d{4}-\\d{2}-\\d{2}"); // YYYY-MM-DD
            Pattern timePattern = Pattern.compile("\\d{1,2}:\\d{2}(\\s?(AM|PM|am|pm))?"); // HH:MM or H:MM with optional AM/PM
            Pattern dateWordPattern = Pattern.compile("\\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\\b", Pattern.CASE_INSENSITIVE);
            Pattern dayPattern = Pattern.compile("\\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\\b", Pattern.CASE_INSENSITIVE);

            List<String> generatedTags = Arrays.stream(tagsText.split(","))
                    .map(String::trim)
                    .filter(tag -> !tag.isEmpty())
                    .map(tag -> toSentenceCase(tag)) // Convert to sentence case
                    .filter(tag -> {
                        // Filter out date/time tags
                        String tagLower = tag.toLowerCase();
                        return !datePattern.matcher(tag).matches()
                                && !timePattern.matcher(tag).matches()
                                && !dateWordPattern.matcher(tagLower).find()
                                && !dayPattern.matcher(tagLower).find();
                    })
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
                if (acronymStoplist.contains(token)) {
                    continue;
                }
                // Heuristic: keep if 'TOKEN building' appears in location or TOKEN appears with digits in description/location
                boolean seemsBuilding = safeLocation.toLowerCase().contains((token + " building").toLowerCase())
                        || buildingRoomPattern.matcher(safeDescription).reset().find()
                        || buildingRoomPattern.matcher(safeLocation).reset().find();
                if (seemsBuilding) {
                    mandatoryLocationTokens.add(token);
                }
            }

            // Merge mandatory tokens first, then AI-generated tags, keeping order and uniqueness
            LinkedHashSet<String> merged = new LinkedHashSet<>();
            for (String t : mandatoryLocationTokens) {
                merged.add(toSentenceCase(t)); // Normalize to sentence case
            }
            for (String t : cleanedGenerated) {
                merged.add(t); // Already normalized to sentence case
            }

            // Enforce exactly 20 tags, prioritizing mandatory tokens
            List<String> finalTags = new ArrayList<>(20);
            for (String t : merged) {
                if (finalTags.size() >= 20) {
                    break;
                }
                finalTags.add(t);
            }

            if (finalTags.size() != 20) {
                log.warn("Generated {} tags after enforcement (expected 20)", finalTags.size());
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

    /**
     * Generate tags with scoring and return top 5 based on weighted relevance
     */
    public List<TagScore> generateScoredTags(String description, String location, String incidentType) {
        List<String> allTags = generateTags(description, location, incidentType);
        return scoreAndRankTags(allTags, description, location, incidentType);
    }

    /**
     * Score tags based on relevance factors and return top 5
     */
    private List<TagScore> scoreAndRankTags(List<String> tags, String description, String location, String incidentType) {
        List<TagScore> scoredTags = new ArrayList<>();

        String safeDescription = (description == null ? "" : description).toLowerCase();
        String safeLocation = (location == null ? "" : location).toLowerCase();
        String safeIncidentType = (incidentType == null ? "" : incidentType).toLowerCase();
        String combinedInput = safeDescription + " " + safeLocation + " " + safeIncidentType;

        // Patterns for building codes
        Pattern buildingCodePattern = Pattern.compile("\\b[A-Z]{2,}\\b");
        Pattern buildingRoomPattern = Pattern.compile("\\b([A-Z]{2,})[- ]?(\\d{1,4})\\b");
        Set<String> acronymStoplist = new HashSet<>(Arrays.asList("CR", "AM", "PM", "API", "URL"));

        for (int i = 0; i < tags.size(); i++) {
            String tag = tags.get(i);
            double score = 0.0;
            StringBuilder reasonBuilder = new StringBuilder();

            String tagLower = tag.toLowerCase();

            // Score based on position in AI-generated list (earlier = better)
            double positionScore = (tags.size() - i) * 0.5;
            score += positionScore;

            // High priority: Mandatory location tokens (building codes)
            if (buildingCodePattern.matcher(tag).matches() && !acronymStoplist.contains(tag)) {
                score += 50.0;
                reasonBuilder.append("Building code; ");
            }

            // High priority: Building-room combinations
            if (buildingRoomPattern.matcher(tag).matches()) {
                score += 45.0;
                reasonBuilder.append("Location identifier; ");
            }

            // High priority: Appears in incident type
            if (safeIncidentType.contains(tagLower) || tagLower.contains(safeIncidentType)) {
                score += 40.0;
                reasonBuilder.append("Matches incident type; ");
            }

            // High priority: Appears in description
            if (safeDescription.contains(tagLower)) {
                score += 35.0;
                reasonBuilder.append("Found in description; ");
            }

            // High priority: Appears in location
            if (safeLocation.contains(tagLower) || tagLower.contains(safeLocation)) {
                score += 30.0;
                reasonBuilder.append("Found in location; ");
            }

            // Medium priority: Partial match in combined input
            if (combinedInput.contains(tagLower)) {
                score += 15.0;
                reasonBuilder.append("Contextual match; ");
            }

            // Additional safety check: Skip date/time patterns if any slip through (already filtered earlier, but double-check)
            Pattern datePattern = Pattern.compile("\\d{4}-\\d{2}-\\d{2}"); // YYYY-MM-DD
            Pattern timePattern = Pattern.compile("\\d{1,2}:\\d{2}(\\s?(AM|PM|am|pm))?"); // HH:MM or H:MM with optional AM/PM
            Pattern dateWordPattern = Pattern.compile("\\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\\b", Pattern.CASE_INSENSITIVE);
            Pattern dayPattern = Pattern.compile("\\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\\b", Pattern.CASE_INSENSITIVE);

            if (datePattern.matcher(tag).matches()
                    || timePattern.matcher(tag).matches()
                    || dateWordPattern.matcher(tagLower).find()
                    || dayPattern.matcher(tagLower).find()) {
                // Skip date/time tags completely - don't add to scoredTags
                continue;
            }

            // Lower priority: Short tags (likely important keywords)
            if (tag.length() <= 4 && !tag.contains("-")) {
                score += 5.0;
                reasonBuilder.append("Keyword; ");
            }

            String reason = reasonBuilder.length() > 0
                    ? reasonBuilder.toString().substring(0, reasonBuilder.length() - 2)
                    : "AI-generated relevance";

            TagScore tagScore = new TagScore();
            tagScore.setTag(tag);
            tagScore.setScore(score);
            tagScore.setReason(reason);
            scoredTags.add(tagScore);
        }

        // Sort by score descending and return top 5
        return scoredTags.stream()
                .sorted((a, b) -> Double.compare(b.getScore() != null ? b.getScore() : 0.0,
                a.getScore() != null ? a.getScore() : 0.0))
                .limit(5)
                .collect(Collectors.toList());
    }

    /**
     * Converts a tag to sentence case (first letter capitalized, rest
     * lowercase). Handles hyphenated tags by capitalizing each word. Preserves
     * acronyms (2-3 uppercase letters in a row).
     */
    private String toSentenceCase(String tag) {
        if (tag == null || tag.isEmpty()) {
            return tag;
        }

        // Check if it's an acronym (2-3 uppercase letters, possibly with numbers)
        if (Pattern.compile("^[A-Z]{2,3}(\\d+)?$").matcher(tag).matches()) {
            return tag.toUpperCase(); // Keep acronyms uppercase
        }

        // Handle hyphenated tags
        if (tag.contains("-")) {
            String[] parts = tag.split("-");
            StringBuilder result = new StringBuilder();
            for (int i = 0; i < parts.length; i++) {
                if (i > 0) {
                    result.append("-");
                }
                String part = parts[i].trim();
                if (!part.isEmpty()) {
                    // Check if part is an acronym
                    if (Pattern.compile("^[A-Z]{2,3}(\\d+)?$").matcher(part).matches()) {
                        result.append(part.toUpperCase());
                    } else {
                        part = part.toLowerCase();
                        if (!part.isEmpty()) {
                            result.append(Character.toUpperCase(part.charAt(0)));
                            if (part.length() > 1) {
                                result.append(part.substring(1));
                            }
                        }
                    }
                }
            }
            return result.toString();
        }

        // Simple case: single word
        tag = tag.toLowerCase();
        if (tag.isEmpty()) {
            return tag;
        }
        return Character.toUpperCase(tag.charAt(0)) + (tag.length() > 1 ? tag.substring(1) : "");
    }
}
