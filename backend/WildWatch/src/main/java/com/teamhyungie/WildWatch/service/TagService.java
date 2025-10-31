package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.IncidentGeneralTag;
import com.teamhyungie.WildWatch.repository.IncidentGeneralTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class TagService {

    private final IncidentGeneralTagRepository tagRepository;

    /**
     * Checks if tags exist in incident_general_tags, inserts if they don't
     * exist, and returns the set of IncidentGeneralTag entities with their IDs.
     *
     * @param tagNames List of tag names to check/insert
     * @return Set of IncidentGeneralTag entities (existing or newly created)
     * with their IDs
     */
    @Transactional
    public Set<IncidentGeneralTag> checkAndSaveTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return new HashSet<>();
        }

        Set<IncidentGeneralTag> tags = new HashSet<>();

        for (String tagName : tagNames) {
            if (tagName == null || tagName.trim().isEmpty()) {
                continue;
            }

            String normalizedTagName = tagName.trim();

            // Check if tag already exists
            IncidentGeneralTag existingTag = tagRepository.findByName(normalizedTagName)
                    .orElse(null);

            if (existingTag != null) {
                // Tag exists, use existing tag_id
                tags.add(existingTag);
                log.debug("Found existing tag: {} with ID: {}", normalizedTagName, existingTag.getTagId());
            } else {
                // Tag doesn't exist, create new one
                IncidentGeneralTag newTag = new IncidentGeneralTag();
                newTag.setName(normalizedTagName);
                newTag = tagRepository.save(newTag);
                tags.add(newTag);
                log.debug("Created new tag: {} with ID: {}", normalizedTagName, newTag.getTagId());
            }
        }

        log.info("Processed {} tags, {} unique tags returned", tagNames.size(), tags.size());
        return tags;
    }
}
