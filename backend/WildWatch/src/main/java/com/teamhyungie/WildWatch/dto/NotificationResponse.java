package com.teamhyungie.WildWatch.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String id;
    private String type;
    private String bulletinId;
    private String bulletinTitle;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isRead;
    private Integer upvoteCount;
    private String latestUpvoterId;
    private String latestUpvoterName;
    private List<String> recentUpvoterIds;
    
    // Helper method to generate notification message
    public String generateMessage() {
        if ("UPVOTE".equals(type)) {
            if (upvoteCount == 1) {
                return latestUpvoterName + " upvoted your bulletin \"" + bulletinTitle + "\"";
            } else if (upvoteCount > 1) {
                int othersCount = upvoteCount - 1;
                return latestUpvoterName + " and " + othersCount + " other" + 
                       (othersCount > 1 ? "s" : "") + " upvoted your bulletin \"" + bulletinTitle + "\"";
            }
        }
        return "New notification for your bulletin \"" + bulletinTitle + "\"";
    }
}
