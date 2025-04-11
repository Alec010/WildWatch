package com.teamhyungie.WildWatch.model;

public enum Office {
    OP("Office of the President", "Oversees the overall operations and strategic direction of the university."),
    VPAA("Office of the Vice President for Academic Affairs", "Manages all academic programs and ensures quality education delivery."),
    VPA("Office of the Vice President for Administration", "Handles administrative support services and university operations."),
    VPF("Office of the Vice President for Finance and Treasurer", "Manages financial planning, budgeting, and fiscal operations."),
    HR("Human Resources Office", "Oversees recruitment, employee relations, and staff development."),
    FO("Finance Office", "Responsible for billing, collections, and financial reporting."),
    MIS("Management Information Systems Office", "Maintains and develops information systems and technical infrastructure."),
    MPO("Marketing and Promotions Office", "Leads branding, advertising, and promotional campaigns for the university."),
    ASO("Office of Admissions and Scholarships", "Handles student enrollment, entrance exams, and scholarship applications."),
    SSO("Student Success Office", "Provides academic support, student services, and disciplinary coordination.");

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