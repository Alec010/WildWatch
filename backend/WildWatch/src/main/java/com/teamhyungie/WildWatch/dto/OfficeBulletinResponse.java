package com.teamhyungie.WildWatch.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OfficeBulletinResponse {
    private String id;
    private String title;
    private String description;
    private String createdBy;
    private LocalDateTime createdAt;
    private Boolean isActive;
    private Integer upvoteCount;
    private Boolean userHasUpvoted;
    private List<BulletinMediaResponse> mediaAttachments;
    private List<IncidentSummaryResponse> relatedIncidents;

    @Data
    public static class BulletinMediaResponse {
        private String id;
        private String fileName;
        private String fileUrl;
        private String fileType;
        private Long fileSize;
        private LocalDateTime uploadedAt;
    }

    @Data
    public static class IncidentSummaryResponse {
        private String id;
        private String trackingNumber;
        private String title;
        private String status;
    }
}
