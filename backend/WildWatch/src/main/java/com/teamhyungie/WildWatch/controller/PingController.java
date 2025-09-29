package com.teamhyungie.WildWatch.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Health Check", description = "Health check and system status endpoints")
public class PingController {
    
    @Operation(summary = "Health check", description = "Check if the API is running and accessible")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "API is running and accessible")
    })
    @GetMapping("/api/ping")
    public String ping() {
        return "OK";
    }
} 