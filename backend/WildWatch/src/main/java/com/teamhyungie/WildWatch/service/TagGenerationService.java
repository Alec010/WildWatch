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

    private static final String GEMINI_PRIMARY_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private static final String GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";

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
            // Normalize special characters (em dash, en dash to regular hyphen)
            if (location != null) {
                location = location.replace('\u2013', '-')  // En dash
                                  .replace('\u2014', '-')   // Em dash
                                  .replace('\u2015', '-');  // Horizontal bar
            }
            if (incidentType != null) {
                incidentType = incidentType.replace('\u2013', '-')  // En dash
                                          .replace('\u2014', '-')   // Em dash
                                          .replace('\u2015', '-');  // Horizontal bar
            }
            if (description != null) {
                description = description.replace('\u2013', '-')  // En dash
                                        .replace('\u2014', '-')   // Em dash
                                        .replace('\u2015', '-');  // Horizontal bar
            }
            
            // Sanitize location by removing plus codes before sending to AI
            String sanitizedLocation = removePlusCodes(location);

            String formatString = "You are classifying an incident into tags.\n"
                    + "Input:\n"
                    + "- Incident Type: '%s'\n"
                    + "- Description: '%s'\n"
                    + "- Location: '%s'\n"
                    + "Task:\n"
                    + "- Generate EXACTLY 5 single-word tags (NO phrases, NO hyphens, ONLY one word per tag).\n"
                    + "- First 2 tags MUST be location-related (building names, room identifiers like NGE207, area names from the location).\n"
                    + "- Next 3 tags MUST be about the incident description and incident type (context, severity, parties involved, impact).\n"
                    + "- MANDATORY: If the location contains building identifiers or room codes (e.g., 'NGE207', 'GLE', 'MIS'), include them as location tags WITHOUT hyphens (e.g., 'NGE207' NOT 'NGE-207').\n"
                    + "- DO NOT include date or time tags (e.g., '2025-09-23', '10:30', dates, times).\n"
                    + "- DO NOT add external campuses, cities, or countries that are not explicitly present in the input.\n"
                    + "- Each tag MUST be a SINGLE WORD ONLY in sentence case (first letter capitalized, rest lowercase), except building codes which should be uppercase (e.g., 'NGE207', 'GLE').\n"
                    + "- Avoid duplicates and avoid generic single-word tags like 'Issue' or 'Problem'.\n"
                    + "- Output format: LocationTag1, LocationTag2, DescTag1, DescTag2, DescTag3\n"
                    + "- Example: NGE207, Building, Vandalism, Damage, Urgent";
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
                    .filter(tag -> {
                        // ONLY allow single words (no spaces, no hyphens, alphanumeric only)
                        // Building codes like NGE207 should be without hyphens
                        return tag.matches("^[A-Za-z0-9]+$");
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
                // Normalize building codes: remove hyphens (e.g., NGE-207 -> NGE207)
                String normalized = t;
                if (t.contains("-")) {
                    // Check if it's a building code pattern (e.g., NGE-207, GLE-202)
                    Pattern buildingCodeWithHyphen = Pattern.compile("^([A-Z]{2,})-(\\d+)$");
                    Matcher m = buildingCodeWithHyphen.matcher(t);
                    if (m.matches()) {
                        normalized = m.group(1) + m.group(2); // Remove hyphen: NGE-207 -> NGE207
                    }
                }
                cleanedGenerated.add(normalized);
            }

            // Post-process to ensure building/location codes are present (e.g., GLE, GLE-202)
            List<String> mandatoryLocationTokens = new ArrayList<>();
            Set<String> acronymStoplist = new HashSet<>(Arrays.asList("CR", "AM", "PM"));

            String safeLocation = location == null ? "" : location;
            String safeDescription = description == null ? "" : description;

            // 1) Extract patterns like GLE202 / GLE-202 / GLE 202 from location and description, normalize to GLE202 (NO hyphen, NO space)
            Pattern buildingRoomPattern = Pattern.compile("\\b([A-Z]{2,})[- ]?(\\d{1,4})\\b");
            for (String source : Arrays.asList(safeLocation, safeDescription)) {
                Matcher m = buildingRoomPattern.matcher(source);
                while (m.find()) {
                    String building = m.group(1);
                    String room = m.group(2);
                    if (!acronymStoplist.contains(building)) {
                        String normalized = building + room; // NO hyphen - e.g., NGE207 not NGE-207
                        mandatoryLocationTokens.add(building);
                        mandatoryLocationTokens.add(normalized);
                    }
                }
            }

            // 2) Force include building code/name tokens like "GLE" and "GLEBuilding" (no hyphen)
            Pattern buildingNamePattern = Pattern.compile("\\b([A-Z]{2,})\\s+Building\\b", Pattern.CASE_INSENSITIVE);
            Matcher nameMatcher = buildingNamePattern.matcher(safeLocation);
            while (nameMatcher.find()) {
                String code = nameMatcher.group(1).toUpperCase();
                if (!acronymStoplist.contains(code)) {
                    mandatoryLocationTokens.add(code);
                    mandatoryLocationTokens.add(code + "Building"); // No hyphen
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

            // Enforce exactly 5 tags (2 location + 3 description), prioritizing mandatory tokens
            List<String> finalTags = new ArrayList<>(5);
            for (String t : merged) {
                if (finalTags.size() >= 5) {
                    break;
                }
                finalTags.add(t);
            }

            if (finalTags.size() != 5) {
                log.warn("Generated {} tags after enforcement (expected 5)", finalTags.size());
                // If we have fewer than 3 tags, add fallback tags to ensure minimum
                if (finalTags.size() < 3) {
                    log.error("Critical: Only {} tags generated, adding fallback tags", finalTags.size());
                    // Add generic fallback tags if we have too few
                    if (finalTags.size() == 0) {
                        finalTags.add("Incident");
                        finalTags.add("Report");
                        finalTags.add("Concern");
                    } else if (finalTags.size() == 1) {
                        finalTags.add("Report");
                        finalTags.add("Incident");
                    } else if (finalTags.size() == 2) {
                        finalTags.add("Incident");
                    }
                    // Fill to 5 if needed
                    while (finalTags.size() < 5) {
                        finalTags.add("General");
                    }
                }
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
     * Returns: 2 location tags + 3 description/incident tags
     */
    public List<TagScore> generateScoredTags(String description, String location, String incidentType) {
        List<String> allTags = generateTags(description, location, incidentType);
        return scoreAndRankTags(allTags, description, location, incidentType);
    }

    /**
     * Score tags based on relevance factors and return top 5
     * Structure: First 2 tags from allTags are location tags, next 3 are description tags
     * Returns: Top 2 location tags + Top 3 description tags
     */
    private List<TagScore> scoreAndRankTags(List<String> tags, String description, String location, String incidentType) {
        List<TagScore> result = new ArrayList<>();
        
        // Expecting: First 2 tags are location tags, next 3 are description/incident tags
        // Return: First 2 location tags + Next 3 description tags
        
        if (tags.size() < 5) {
            // Fallback: if not enough tags, return what we have
            for (int i = 0; i < Math.min(5, tags.size()); i++) {
                TagScore ts = new TagScore();
                ts.setTag(tags.get(i));
                ts.setScore(100.0 - (i * 10.0));
                ts.setReason(i < 2 ? "Location tag" : "Description tag");
                result.add(ts);
            }
            return result;
        }
        
        // Take first 2 location tags (indices 0, 1)
        for (int i = 0; i < Math.min(2, tags.size()); i++) {
            TagScore ts = new TagScore();
            ts.setTag(tags.get(i));
            ts.setScore(100.0 - (i * 5.0)); // High score for location tags
            ts.setReason("Location tag");
            result.add(ts);
        }
        
        // Take next 3 description tags (indices 2, 3, 4)
        for (int i = 2; i < Math.min(5, tags.size()); i++) {
            TagScore ts = new TagScore();
            ts.setTag(tags.get(i));
            ts.setScore(90.0 - ((i - 2) * 5.0)); // Slightly lower score for description tags
            ts.setReason("Description tag");
            result.add(ts);
        }
        
        return result;
    }

    /**
     * Converts a tag to sentence case (first letter capitalized, rest
     * lowercase). Preserves building codes like NGE207 in uppercase.
     */
    private String toSentenceCase(String tag) {
        if (tag == null || tag.isEmpty()) {
            return tag;
        }

        // Check if it's a building code (2+ uppercase letters followed by digits, e.g., NGE207, GLE202)
        if (Pattern.compile("^[A-Z]{2,}\\d+$").matcher(tag).matches()) {
            return tag.toUpperCase(); // Keep building codes like NGE207 uppercase
        }

        // Check if it's an acronym (2-3 uppercase letters, possibly with numbers)
        if (Pattern.compile("^[A-Z]{2,3}(\\d+)?$").matcher(tag).matches()) {
            return tag.toUpperCase(); // Keep acronyms uppercase
        }

        // Simple case: single word - convert to sentence case
        tag = tag.toLowerCase();
        if (tag.isEmpty()) {
            return tag;
        }
        return Character.toUpperCase(tag.charAt(0)) + (tag.length() > 1 ? tag.substring(1) : "");
    }
}
