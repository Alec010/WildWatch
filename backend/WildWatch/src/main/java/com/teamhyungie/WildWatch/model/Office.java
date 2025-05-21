package com.teamhyungie.WildWatch.model;

public enum Office {
    OP("Office of the President", "Oversees the overall operations, strategic direction, and institutional development of the university. This office sets the vision, ensures compliance with educational standards, and represents CIT-U in external affairs, driving the university's mission and goals."),
    VPAA("Office of the Vice President for Academic Affairs", "Manages all academic programs, curriculum development, and faculty affairs. It ensures the quality of education delivery, implements academic policies, and fosters an environment conducive to learning and intellectual growth across all colleges and departments."),
    VPA("Office of the Vice President for Administration", "Handles comprehensive administrative support services and manages the overall university operations. This includes overseeing campus facilities, general services, and ensuring the smooth day-to-day functioning of the institution to support academic and student needs."),
    VPF("Office of the Vice President for Finance and Treasurer", "Manages the university's financial planning, budgeting, and fiscal operations. This office is responsible for financial sustainability, resource allocation, investment strategies, and ensuring sound financial management."),
    HR("Human Resources Office", "Oversees recruitment, employee relations, staff development, and welfare programs. This office handles all aspects of human capital, from hiring and onboarding to performance management and ensuring a positive work environment for all university employees."),
    FO("Finance Office", "Responsible for billing, collections, disbursements, and financial reporting. This office processes student payments, manages university expenditures, and ensures accurate financial records and compliance with accounting standards."),
    MIS("Management Information Systems Office", "Maintains and develops the university's information systems and technical infrastructure. This includes managing network systems, databases, software applications, and providing technological support to all departments and users."),
    MPO("Marketing and Promotions Office", "Leads branding, advertising, and promotional campaigns for the university. This office is crucial for attracting prospective students, enhancing the university's public image, and communicating its achievements and offerings to a wider audience."),
    OAS("Office of Admissions and Scholarships", "Handles student enrollment, entrance examinations, scholarship applications, and financial aid programs. This office guides prospective students through the application process and helps eligible students access various scholarship opportunities."),
    SSO("Student Success Office", "Provides academic support, student services, and disciplinary coordination. This office focuses on enhancing the student experience through guidance, counseling, student activities, and ensuring adherence to university policies and codes of conduct."),
    TSG("Technical Service Group", "Provides technical support and maintenance services for university equipment and facilities. This group ensures that all technical aspects of the campus, from laboratory equipment to general infrastructure, are operational and well-maintained.");

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