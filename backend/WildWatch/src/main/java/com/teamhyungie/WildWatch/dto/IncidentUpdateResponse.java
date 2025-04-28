package com.teamhyungie.WildWatch.dto;

import java.time.LocalDateTime;

public class IncidentUpdateResponse {
    private Long id;
    private String message;
    private String status;
    private String updatedByFullName;
    private LocalDateTime updatedAt;
    private boolean isVisibleToReporter;

    public IncidentUpdateResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUpdatedByFullName() {
        return updatedByFullName;
    }

    public void setUpdatedByFullName(String updatedByFullName) {
        this.updatedByFullName = updatedByFullName;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isVisibleToReporter() {
        return isVisibleToReporter;
    }

    public void setVisibleToReporter(boolean visibleToReporter) {
        this.isVisibleToReporter = visibleToReporter;
    }
} 