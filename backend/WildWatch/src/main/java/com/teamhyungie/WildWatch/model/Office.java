package com.teamhyungie.WildWatch.model;

public enum Office {
    TSG("Technical Service Group", 
        "ONLY for: WiFi issues, internet connectivity, network problems, computer/laptop issues, laboratory equipment (NGE Building labs), technical support, IT infrastructure."),
    
    OPC("Office of the Property Custodian", 
        "ONLY for: University property/assets, equipment inventory, procurement, campus grounds maintenance, building facilities (non-security), property disposal."),
    
    SSO("Student Success Office", 
        "ONLY for: Student disciplinary matters (fights, bullying, misbehavior, student conflicts, violence between students), academic support, counseling, student activities/events, academic misconduct, behavior issues, student records, scholarships."),
    
    SSD("Safety and Security Department", 
        "ONLY for: ALL parking issues (illegal parking, parking violations, parking permits, vehicle problems, parking lot incidents), theft, robbery, external security threats, safety hazards (fire, building damage), suspicious outsiders, emergency incidents, accidents involving non-students, injuries requiring medical attention, security personnel issues."),
    
    SSG("Supreme Student Government", 
        "Official student governing body representing all students. Advocates for student rights and welfare. Organizes student activities and events. Concerns will be lobbied here if not in other offices.");

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