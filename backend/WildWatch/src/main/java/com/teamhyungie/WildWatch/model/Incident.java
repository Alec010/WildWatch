package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidents")
@Data
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "Incident type is required")
    @Column(name = "incident_type")
    private String incidentType;

    @NotNull(message = "Date of incident is required")
    @Column(name = "date_of_incident")
    private LocalDate dateOfIncident;

    @NotNull(message = "Time of incident is required")
    @Column(name = "time_of_incident")
    private LocalTime timeOfIncident;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Description is required")
    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "assigned_office")
    private Office assignedOffice;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level")
    private PriorityLevel priorityLevel;

    @Column(name = "tracking_number", unique = true)
    private String trackingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "status")
    private String status = "Pending"; // Default status

    @Column(name = "verified")
    private Boolean verified = false; // Changed from boolean to Boolean

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private java.util.List<Evidence> evidence;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private java.util.List<Witness> witnesses;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
        if (trackingNumber == null) {
            // Generate a tracking number: INC-YYYYMMDD-XXXX (X = random alphanumeric)
            String datePart = LocalDate.now().toString().replace("-", "");
            String randomPart = String.format("%04d", (int) (Math.random() * 10000));
            trackingNumber = "INC-" + datePart + "-" + randomPart;
        }
    }
} 