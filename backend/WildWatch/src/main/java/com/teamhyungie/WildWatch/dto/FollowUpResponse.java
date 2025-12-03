package com.teamhyungie.WildWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpResponse {
    private boolean success;
    private String message;
    private LocalDateTime nextAvailableTime;
    
    public static FollowUpResponse success(LocalDateTime nextAvailableTime) {
        return new FollowUpResponse(true, "Follow-up sent successfully", nextAvailableTime);
    }
    
    public static FollowUpResponse error(String message, LocalDateTime nextAvailableTime) {
        return new FollowUpResponse(false, message, nextAvailableTime);
    }
}
