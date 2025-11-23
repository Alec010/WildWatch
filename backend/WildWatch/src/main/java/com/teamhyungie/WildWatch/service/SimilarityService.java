package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SimilarityService {

    private final IncidentRepository incidentRepository;
    private final com.teamhyungie.WildWatch.repository.IncidentUpdateRepository incidentUpdateRepository;

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

    // Tunable parameters
    private static final double SIMILARITY_THRESHOLD = 0.60; // 60% tag overlap required for similarity
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
    }

    /**
     * Tag-based similarity using Jaccard similarity on all 20 tags.
     * Compares submitted incident tags with in-progress and resolved incidents' tags
     * (In Progress, Resolved only - excludes Pending, Verified, Closed, Dismissed).
     * Uses 60% threshold (0.60) for Jaccard similarity.
     * 
     * @param submittedTags All 20 generated tags from the new incident
     * @param maxResults Maximum number of similar incidents to return
     * @return List of similar incidents sorted by similarity score (descending)
     */
    public List<SimilarIncident> findSimilarByTags(List<String> submittedTags, int maxResults) {
        if (submittedTags == null || submittedTags.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Normalize submitted tags (all 20 tags) - lowercase and trim
        Set<String> submittedTagSet = submittedTags.stream()
            .map(String::toLowerCase)
            .map(String::trim)
            .filter(tag -> !tag.isEmpty())
            .collect(Collectors.toSet());
        
        if (submittedTagSet.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Get all resolved incidents with their tags loaded
        List<Incident> candidates = getResolvedIncidentsWithTags();
        
        List<SimilarIncident> results = new ArrayList<>();
        
        for (Incident candidate : candidates) {
            // Get ALL 20 tags from candidate (from generalTags, not transient tags field)
            Set<String> candidateTagSet = candidate.getGeneralTags().stream()
                .map(com.teamhyungie.WildWatch.model.IncidentGeneralTag::getName)
                .map(String::toLowerCase)
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .collect(Collectors.toSet());
            
            if (candidateTagSet.isEmpty()) {
                continue; // Skip incidents without tags
            }
            
            // Calculate Jaccard similarity: intersection / union
            Set<String> intersection = new HashSet<>(submittedTagSet);
            intersection.retainAll(candidateTagSet);
            
            Set<String> union = new HashSet<>(submittedTagSet);
            union.addAll(candidateTagSet);
            
            double similarity = union.isEmpty() ? 0.0 
                : (double) intersection.size() / union.size();
            
            // 60% threshold (0.60)
            if (similarity >= SIMILARITY_THRESHOLD) {
                SimilarIncident si = buildSimilarIncidentFromIncident(candidate, similarity);
                results.add(si);
            }
        }
        
        // Sort by similarity descending and limit results
        return results.stream()
            .sorted(Comparator.comparingDouble((SimilarIncident s) -> s.similarityScore).reversed())
            .limit(Math.max(1, maxResults > 0 ? maxResults : MAX_RESULTS_DEFAULT))
            .collect(Collectors.toList());
    }

    /**
     * Helper method to get in-progress and resolved incidents with tags loaded (with caching support)
     * Includes: In Progress, Resolved (excludes Pending, Verified, Closed, Dismissed)
     */
    private List<Incident> getResolvedIncidentsWithTags() {
        if (!cacheEnabled) {
            List<Incident> all = incidentRepository.findResolvedWithResolutionNotesAndTagsOrderBySubmittedAtDesc();
            return all.size() > cacheMaxCandidates ? all.subList(0, cacheMaxCandidates) : all;
        }
        
        long now = System.currentTimeMillis();
        long ttlMs = Math.max(1L, cacheTtlMinutes) * 60_000L;
        if (cachedResolved == null || (now - lastCacheRefreshMs) > ttlMs) {
            synchronized (this) {
                if (cachedResolved == null || (now - lastCacheRefreshMs) > ttlMs) {
                    List<Incident> all = incidentRepository.findResolvedWithResolutionNotesAndTagsOrderBySubmittedAtDesc();
                    cachedResolved = all.size() > cacheMaxCandidates 
                        ? new ArrayList<>(all.subList(0, cacheMaxCandidates)) 
                        : new ArrayList<>(all);
                    lastCacheRefreshMs = now;
                }
            }
        }
        return new ArrayList<>(cachedResolved);
    }

    /**
     * Helper method to build SimilarIncident from Incident entity
     */
    private SimilarIncident buildSimilarIncidentFromIncident(Incident inc, double similarity) {
        SimilarIncident si = new SimilarIncident();
        si.id = inc.getId();
        si.trackingNumber = inc.getTrackingNumber();
        si.similarityScore = similarity;
        si.incidentType = inc.getIncidentType();
        si.location = inc.getLocation();
        si.assignedOffice = inc.getAssignedOffice() != null ? inc.getAssignedOffice().name() : null;
        si.submittedAt = inc.getSubmittedAt() == null ? null : java.sql.Timestamp.valueOf(inc.getSubmittedAt());
        
        // Determine finished date (latest Resolved/Closed update)
        try {
            var finishedUpdate = incidentUpdateRepository.findFirstByIncidentAndStatusInOrderByUpdatedAtDesc(
                inc, java.util.Arrays.asList("Resolved", "resolved", "Closed", "closed")
            );
            if (finishedUpdate != null) {
                si.finishedDate = finishedUpdate.getUpdatedAt();
            }
        } catch (Exception ignored) {}
        
        si.resolutionNotes = inc.getResolutionNotes();
        si.description = inc.getDescription();
        return si;
    }
}


