package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.service.TagGenerationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {
    private final TagGenerationService tagGenerationService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateTags(@RequestBody TagRequest request) {
        List<String> tags = tagGenerationService.generateTags(request.getDescription(), request.getLocation());
        if (tags.size() > 10) tags = tags.subList(0, 10);
        return ResponseEntity.ok(Map.of("tags", tags));
    }

    @Data
    public static class TagRequest {
        private String description;
        private String location;
    }
} 