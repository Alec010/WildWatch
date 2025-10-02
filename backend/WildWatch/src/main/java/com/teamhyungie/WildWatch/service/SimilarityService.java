package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SimilarityService {

    private final IncidentRepository incidentRepository;
    private final com.teamhyungie.WildWatch.repository.IncidentUpdateRepository incidentUpdateRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String apiKey;

    // Simple in-memory cache for recent resolved incidents
    @Value("${similarity.cache.enabled:true}")
    private boolean cacheEnabled;
    @Value("${similarity.cache.ttlMinutes:10}")
    private long cacheTtlMinutes;
    @Value("${similarity.cache.maxCandidates:30}")
    private int cacheMaxCandidates;

    private volatile List<Incident> cachedResolved = null;
    private volatile long lastCacheRefreshMs = 0L;

    public void invalidateCache() {
        lastCacheRefreshMs = 0L;
    }

    private List<Incident> getRecentResolvedCandidates() {
        if (!cacheEnabled) {
            List<Incident> all = incidentRepository.findResolvedWithResolutionNotesOrderBySubmittedAtDesc();
            return all.size() > cacheMaxCandidates ? all.subList(0, cacheMaxCandidates) : all;
        }
        long now = System.currentTimeMillis();
        long ttlMs = Math.max(1L, cacheTtlMinutes) * 60_000L;
        if (cachedResolved == null || (now - lastCacheRefreshMs) > ttlMs) {
            synchronized (this) {
                if (cachedResolved == null || (now - lastCacheRefreshMs) > ttlMs) {
                    List<Incident> all = incidentRepository.findResolvedWithResolutionNotesOrderBySubmittedAtDesc();
                    cachedResolved = all.size() > cacheMaxCandidates ? new ArrayList<>(all.subList(0, cacheMaxCandidates)) : new ArrayList<>(all);
                    lastCacheRefreshMs = now;
                }
            }
        }
        return new ArrayList<>(cachedResolved);
    }

    private static final String GEMINI_PRIMARY_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    private static final String GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    // Tunable parameters
    private static final double SIMILARITY_THRESHOLD = 0.55; // lowered further to catch near-duplicates
    private static final double DESCRIPTION_WEIGHT = 0.70;   // emphasize description content
    private static final int MAX_RESULTS_DEFAULT = 3;

    public static class SimilarIncident {
        public String id;
        public String trackingNumber;
        public double similarityScore;
        public String incidentType;
        public String location;
        public String assignedOffice;
        public Date submittedAt;
        public LocalDateTime finishedDate;
        public String resolutionNotes;
        public String description;
        public String latestUpdateMessage; // for in-progress
        public LocalDateTime latestUpdateAt; // for in-progress
    }

    public List<SimilarIncident> findSimilar(String incidentType, String description, String normalizedLocation, List<String> tags, int maxResults) {
        String queryText = buildText(incidentType, description, normalizedLocation, tags);
        Map<String, Double> queryVector = toTfVector(queryText);
        Map<String, Double> queryDescVector = toTfVector(normalize(safe(description)));

        // Fetch resolved/closed with notes
        List<Incident> resolved = incidentRepository.findResolvedWithResolutionNotes();
        // Fetch in-progress incidents (limit by cacheMaxCandidates for safety)
        List<Incident> inProgress = incidentRepository.findInProgressOrderBySubmittedAtDesc();
        if (inProgress.size() > cacheMaxCandidates) inProgress = inProgress.subList(0, cacheMaxCandidates);

        // Build latest update map for in-progress to avoid N+1
        Map<String, String> latestUpdateMsgById = new HashMap<>();
        Map<String, LocalDateTime> latestUpdateAtById = new HashMap<>();
        if (!inProgress.isEmpty()) {
            List<String> ids = inProgress.stream().map(Incident::getId).collect(Collectors.toList());
            var latestUpdates = incidentUpdateRepository.findLatestUpdatesForIncidents(ids);
            for (var u : latestUpdates) {
                if (u.getIncident() != null && u.getIncident().getId() != null) {
                    latestUpdateMsgById.put(u.getIncident().getId(), u.getMessage());
                    latestUpdateAtById.put(u.getIncident().getId(), u.getUpdatedAt());
                }
            }
        }

        List<Incident> candidates = new ArrayList<>();
        candidates.addAll(resolved);
        candidates.addAll(inProgress);

        List<SimilarIncident> scored = new ArrayList<>();
        for (Incident inc : candidates) {
            String candidateText = buildText(
                    inc.getIncidentType(),
                    inc.getDescription(),
                    inc.getFormattedAddress() != null ? (inc.getFormattedAddress() + " - " + inc.getLocation()) : inc.getLocation(),
                    inc.getTags()
            );
            Map<String, Double> candVector = toTfVector(candidateText);
            Map<String, Double> candDescVector = toTfVector(normalize(safe(inc.getDescription())));

            // Blend: heavier weight to description cosine, plus fallback Jaccard on descriptions
            double fullCos = cosineSimilarity(queryVector, candVector);
            double descCos = cosineSimilarity(queryDescVector, candDescVector);
            double jaccDesc = jaccard(simpleset(normalize(safe(description))), simpleset(normalize(safe(inc.getDescription()))));

            double blended = DESCRIPTION_WEIGHT * descCos + (1.0 - DESCRIPTION_WEIGHT) * fullCos;
            double sim = Math.max(blended, jaccDesc);

            if (sim >= SIMILARITY_THRESHOLD) {
                SimilarIncident si = new SimilarIncident();
                si.id = inc.getId();
                si.trackingNumber = inc.getTrackingNumber();
                si.similarityScore = sim;
                si.incidentType = inc.getIncidentType();
                si.location = inc.getLocation();
                si.assignedOffice = inc.getAssignedOffice() != null ? inc.getAssignedOffice().name() : null;
                si.submittedAt = inc.getSubmittedAt() == null ? null : java.sql.Timestamp.valueOf(inc.getSubmittedAt());
                // Populate resolution or latest update fields
                String status = inc.getStatus() == null ? "" : inc.getStatus().toLowerCase(Locale.ROOT);
                if ("resolved".equals(status) || "closed".equals(status)) {
                    try {
                        var finishedUpdate = incidentUpdateRepository.findFirstByIncidentAndStatusInOrderByUpdatedAtDesc(
                            inc, java.util.Arrays.asList("Resolved", "resolved", "Closed", "closed")
                        );
                        if (finishedUpdate != null) {
                            si.finishedDate = finishedUpdate.getUpdatedAt();
                        }
                    } catch (Exception ignored) {}
                    si.resolutionNotes = inc.getResolutionNotes();
                } else {
                    si.latestUpdateMessage = latestUpdateMsgById.get(inc.getId());
                    si.latestUpdateAt = latestUpdateAtById.get(inc.getId());
                }
                si.description = inc.getDescription();
                scored.add(si);
            }
        }

        return scored.stream()
                .sorted(Comparator.comparingDouble((SimilarIncident s) -> s.similarityScore).reversed())
                .limit(Math.max(1, maxResults > 0 ? maxResults : MAX_RESULTS_DEFAULT))
                .collect(Collectors.toList());
    }

    /**
     * Pure AI matching: pass new incident and a compact list of resolved incidents to Gemini, take its top results.
     */
    public List<SimilarIncident> findSimilarAi(String incidentType, String description, String normalizedLocation, List<String> tags, int maxResults) {
        // Use resolved candidates; optionally could append in-progress similarly if desired for AI path.
        List<Incident> all = getRecentResolvedCandidates();

        // Build AI prompt
        StringBuilder sb = new StringBuilder();
        sb.append("You are an assistant that identifies previously resolved incidents most similar to a NEW incident.\n")
          .append("Return ONLY JSON: {matches:[{trackingNumber:string, score:number}]} where score is 0..1.\n")
          .append("Focus on semantic similarity of the problem (e.g., wifi down, NGE207), handle typos, don't consider reporter identity.\n\n");

        sb.append("NEW_INCIDENT:\n");
        sb.append("type: ").append(safe(incidentType)).append("\n");
        sb.append("location: ").append(safe(normalizedLocation)).append("\n");
        sb.append("description: ").append(safe(description)).append("\n");
        if (tags != null && !tags.isEmpty()) sb.append("tags: ").append(String.join(", ", tags)).append("\n");

        sb.append("\nCANDIDATES:\n");
        for (Incident inc : all) {
            sb.append("- trackingNumber: ").append(safe(inc.getTrackingNumber()))
              .append(" | office: ").append(inc.getAssignedOffice() != null ? inc.getAssignedOffice().name() : "")
              .append(" | location: ").append(safe(inc.getLocation()))
              .append(" | description: ").append(safe(inc.getDescription()))
              .append("\n");
        }

        Map<String, Object> part = new HashMap<>();
        part.put("text", sb.toString());
        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(part));
        Map<String, Object> body = new HashMap<>();
        body.put("contents", Collections.singletonList(content));

        // Use property-injected API key (aligned with other services)
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("${GEMINI_API_KEY}")) {
            // Fall back to lightweight similarity if key is not configured
            return findSimilar(incidentType, description, normalizedLocation, tags, maxResults);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        String primaryUrl = GEMINI_PRIMARY_URL + "?key=" + apiKey;
        String fallbackUrl = GEMINI_FALLBACK_URL + "?key=" + apiKey;

        List<Map<String, Object>> matches = null;
        try {
            ResponseEntity<Map> resp = restTemplate.exchange(primaryUrl, org.springframework.http.HttpMethod.POST, entity, Map.class);
            Map<?,?> respBody = resp.getBody();
            matches = parseMatchesFromGemini(respBody);
            if (matches == null) {
                ResponseEntity<Map> resp2 = restTemplate.exchange(fallbackUrl, org.springframework.http.HttpMethod.POST, entity, Map.class);
                matches = parseMatchesFromGemini(resp2.getBody());
            }
        } catch (Exception ex) {
            try {
                ResponseEntity<Map> resp2 = restTemplate.exchange(fallbackUrl, org.springframework.http.HttpMethod.POST, entity, Map.class);
                matches = parseMatchesFromGemini(resp2.getBody());
            } catch (Exception ignored) {}
        }

        if (matches == null) {
            // Robust fallback to lightweight if AI output couldn't be parsed
            return findSimilar(incidentType, description, normalizedLocation, tags, maxResults);
        }

        Map<String, Double> aiScores = new HashMap<>();
        for (Map<String, Object> m : matches) {
            String tn = String.valueOf(m.getOrDefault("trackingNumber", ""));
            Double sc = null;
            try { sc = Double.valueOf(String.valueOf(m.get("score"))); } catch (Exception ignored) {}
            if (tn != null && !tn.isBlank() && sc != null) aiScores.put(tn, Math.max(0.0, Math.min(1.0, sc)));
        }

        Map<String, Incident> tnToIncident = new HashMap<>();
        for (Incident inc : all) tnToIncident.put(inc.getTrackingNumber(), inc);

        List<SimilarIncident> results = new ArrayList<>();
        for (Map.Entry<String, Double> e : aiScores.entrySet()) {
            if (e.getValue() == null || e.getValue() < SIMILARITY_THRESHOLD) continue;
            Incident inc = tnToIncident.get(e.getKey());
            if (inc == null) continue;
            SimilarIncident si = new SimilarIncident();
            si.id = inc.getId();
            si.trackingNumber = inc.getTrackingNumber();
            si.similarityScore = e.getValue();
            si.incidentType = inc.getIncidentType();
            si.location = inc.getLocation();
            si.assignedOffice = inc.getAssignedOffice() != null ? inc.getAssignedOffice().name() : null;
            si.submittedAt = inc.getSubmittedAt() == null ? null : java.sql.Timestamp.valueOf(inc.getSubmittedAt());
            try {
                var finishedUpdate = incidentUpdateRepository.findFirstByIncidentAndStatusInOrderByUpdatedAtDesc(
                    inc, java.util.Arrays.asList("Resolved", "resolved", "Closed", "closed")
                );
                if (finishedUpdate != null) si.finishedDate = finishedUpdate.getUpdatedAt();
            } catch (Exception ignored) {}
            si.resolutionNotes = inc.getResolutionNotes();
            si.description = inc.getDescription();
            results.add(si);
        }

        return results.stream()
                .sorted(Comparator.comparingDouble((SimilarIncident s) -> s.similarityScore).reversed())
                .limit(Math.max(1, maxResults > 0 ? maxResults : MAX_RESULTS_DEFAULT))
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> parseMatchesFromGemini(Map<?,?> respBody) {
        if (respBody == null) return null;
        // Gemini returns candidates[0].content.parts[0].text as a JSON string
        try {
            Object candidates = respBody.get("candidates");
            if (!(candidates instanceof List)) return null;
            Object first = ((List<?>) candidates).isEmpty() ? null : ((List<?>) candidates).get(0);
            if (!(first instanceof Map)) return null;
            Object content = ((Map<?,?>) first).get("content");
            if (!(content instanceof Map)) return null;
            Object parts = ((Map<?,?>) content).get("parts");
            if (!(parts instanceof List)) return null;
            Object part0 = ((List<?>) parts).isEmpty() ? null : ((List<?>) parts).get(0);
            if (!(part0 instanceof Map)) return null;
            Object text = ((Map<?,?>) part0).get("text");
            if (!(text instanceof String)) return null;

            String raw = ((String) text).trim();
            // Strip markdown fences if present
            if (raw.startsWith("```")) {
                int firstNl = raw.indexOf('\n');
                if (firstNl > 0) raw = raw.substring(firstNl + 1);
                int fence = raw.lastIndexOf("```");
                if (fence > 0) raw = raw.substring(0, fence);
                raw = raw.trim();
            }

            // Find first JSON object in the string
            int objStart = raw.indexOf('{');
            int objEnd = raw.lastIndexOf('}');
            if (objStart < 0 || objEnd <= objStart) return null;
            String json = raw.substring(objStart, objEnd + 1);

            JsonNode root = objectMapper.readTree(json);
            JsonNode matchesNode = root.path("matches");
            if (!matchesNode.isArray()) return null;
            List<Map<String, Object>> out = new ArrayList<>();
            for (JsonNode n : matchesNode) {
                Map<String, Object> m = new HashMap<>();
                if (n.hasNonNull("trackingNumber")) m.put("trackingNumber", n.get("trackingNumber").asText());
                if (n.hasNonNull("score")) m.put("score", n.get("score").asDouble());
                if (!m.isEmpty()) out.add(m);
            }
            return out;
        } catch (Exception e) {
            return null;
        }
    }

    private static String buildText(String incidentType, String description, String normalizedLocation, List<String> tags) {
        String tagsText = tags == null ? "" : String.join(", ", tags);
        String text = String.join("\n", Arrays.asList(
                safe(incidentType),
                safe(description),
                safe(normalizedLocation),
                tagsText
        ));
        return normalize(text);
    }

    private static String normalize(String s) {
        String t = s == null ? "" : s.toLowerCase(Locale.ROOT);
        t = Normalizer.normalize(t, Normalizer.Form.NFKC);
        return t.replaceAll("[^a-z0-9\n ]+", " ").replaceAll("\\s+", " ").trim();
    }

    private static String safe(String s) { return s == null ? "" : s; }

    private static Map<String, Double> toTfVector(String text) {
        Map<String, Double> vec = new HashMap<>();
        for (String token : text.split(" ")) {
            if (token.isBlank()) continue;
            vec.put(token, vec.getOrDefault(token, 0.0) + 1.0);
        }
        double norm = Math.sqrt(vec.values().stream().mapToDouble(v -> v * v).sum());
        if (norm > 0) {
            for (Map.Entry<String, Double> e : vec.entrySet()) {
                e.setValue(e.getValue() / norm);
            }
        }
        return vec;
    }

    private static double cosineSimilarity(Map<String, Double> a, Map<String, Double> b) {
        if (a.isEmpty() || b.isEmpty()) return 0.0;
        double dot = 0.0;
        Map<String, Double> small = a.size() < b.size() ? a : b;
        Map<String, Double> large = small == a ? b : a;
        for (Map.Entry<String, Double> e : small.entrySet()) {
            Double v = large.get(e.getKey());
            if (v != null) dot += e.getValue() * v;
        }
        return Math.max(0.0, Math.min(1.0, dot));
    }

    private static Set<String> simpleset(String text) {
        if (text == null || text.isBlank()) return Collections.emptySet();
        String[] parts = text.split(" ");
        Set<String> set = new HashSet<>();
        for (String p : parts) {
            if (!p.isBlank()) set.add(p);
        }
        return set;
    }

    private static double jaccard(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) return 0.0;
        Set<String> inter = new HashSet<>(a);
        inter.retainAll(b);
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        return (double) inter.size() / (double) union.size();
    }
}


