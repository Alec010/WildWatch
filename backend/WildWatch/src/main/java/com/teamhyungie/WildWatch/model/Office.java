package com.teamhyungie.WildWatch.model;

public enum Office {
    OP("Office of the President", 
       "The supreme authority and strategic core of CIT-U, overseeing institutional operations, strategic direction, and development. Handles high-level decision-making, resource allocation, and ensures compliance with educational standards. Manages executive communications, legal affairs, and institutional planning."),
    
    VPAA("Office of the Vice President for Academic Affairs", 
         "Custodian of CIT-U's educational mission, managing academic programs, curriculum development, and faculty affairs. Oversees research activities, academic policies, and accreditation processes. Ensures quality education delivery through innovative teaching methodologies and educational technology integration."),
    
    VPA("Office of the Vice President for Administration", 
        "Operational backbone of CIT-U, managing campus facilities, utilities, and general services. Handles building maintenance, security protocols, and campus development projects. Ensures compliance with health, safety, and environmental standards while maintaining an efficient operational environment."),
    
    VPF("Office of the Vice President for Finance and Treasurer", 
        "Financial steward of CIT-U, managing financial planning, budgeting, and fiscal operations. Oversees revenue generation, expenditure control, and investment strategies. Ensures financial sustainability and compliance with accounting standards while managing university assets and resources."),
    
    HR("Human Resources Office", 
       "Manages the entire employee lifecycle from recruitment to development. Handles employee relations, welfare programs, and performance management. Ensures compliance with labor laws and maintains a positive work environment through comprehensive staff development and support services."),
    
    FO("Finance Office", 
       "Operational arm of financial management, handling billing, collections, and disbursements. Processes student payments, manages vendor payments, and maintains financial records. Ensures accurate financial reporting and compliance with accounting standards while managing cash flow and university assets."),
    
    MIS("Management Information Systems Office", 
        "Manages the university's software systems and digital services. Handles user accounts, software licenses, and system security. Provides support for academic and administrative software applications. Manages the university's website, email systems, and online learning platforms. Responsible for cybersecurity policies and digital service management."),
    
    MPO("Marketing and Promotions Office", 
        "Strategic communication and brand steward of CIT-U. Develops branding strategies and manages promotional campaigns. Handles university website, social media presence, and organizes events to showcase CIT-U's offerings and achievements to prospective students and the public."),
    
    OAS("Office of Admissions and Scholarships", 
        "Primary gateway for prospective students, managing enrollment processes and financial aid. Handles application processing, entrance examinations, and scholarship programs. Guides students through admission and ensures access to financial assistance for qualified applicants."),
    
    SSO("Student Success Office", 
        "Dedicated to student development and academic success. Provides academic support, counseling, and coordinates student activities. Manages disciplinary matters and student records while fostering a supportive environment for personal and academic growth."),
    
    TSG("Technical Service Group", 
        "Sole handler of all WiFi and network connectivity issues. Manages all WiFi access points, network infrastructure, and connectivity problems across campus. Handles all WiFi-related concerns including connection issues, password problems, signal strength, and hardware maintenance. Responsible for installing, configuring, and maintaining all network equipment including WiFi routers, switches, and cabling. Provides immediate technical support for any network or WiFi connectivity problems. Ensures reliable network access through regular maintenance and prompt resolution of connectivity issues.");

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