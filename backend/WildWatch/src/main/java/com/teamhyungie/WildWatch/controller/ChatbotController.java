package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.ChatbotRequest;
import com.teamhyungie.WildWatch.dto.ChatbotResponse;
import com.teamhyungie.WildWatch.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {
    private final ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<ChatbotResponse> chat(@RequestBody ChatbotRequest request) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ChatbotResponse("Invalid message."));
        }
        String reply = chatbotService.chat(request.getMessage());
        return ResponseEntity.ok(new ChatbotResponse(reply));
    }
} 