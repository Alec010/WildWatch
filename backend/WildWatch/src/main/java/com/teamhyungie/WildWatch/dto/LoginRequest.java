package com.teamhyungie.WildWatch.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Email or username is required")
    private String email; // This will be used as username in the system

    @NotBlank(message = "Password is required")
    private String password;
} 