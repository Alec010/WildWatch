package com.teamhyungie.WildWatch.model;

public enum Office {
    TSG("Technical Support Group", "Provides technical support and IT services."),
    OPC("Office of the President and Chancellor", "Oversees the overall operations and strategic direction of the university."),
    MSDO("Medical Services and Dental Office", "Provides medical and dental services to the university community."),
    SECURITY("Security Office", "Ensures campus safety and security."),
    PE("Physical Education Office", "Manages physical education programs and facilities.");

    private final String fullName;
    private final String description;

    Office(String fullName, String description) {
        this.fullName = fullName;
        this.description = description;
    }

    public String getFullName() {
        return fullName;
    }

    public String getDescription() {
        return description;
    }
} 