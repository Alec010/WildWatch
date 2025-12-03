package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import static com.teamhyungie.WildWatch.config.TimezoneConfig.APP_TIMEZONE;

@Entity
@Table(name = "incidents")
@Data
@EqualsAndHashCode(exclude = {"generalTags", "evidence", "witnesses", "submittedBy", "resolvedBy", "resolutionExtendedBy"})
@org.hibernate.annotations.Cache(usage = org.hibernate.annotations.CacheConcurrencyStrategy.READ_WRITE)
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

    @Column(name = "formatted_address")
    private String formattedAddress;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "building")
    private Building building;

    @Column(name = "room")
    private String room; // Optional specific room/location within the building

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

    @Column(name = "resolution_notes", length = 2000)
    private String resolutionNotes;

    @Column(name = "dismissal_notes", length = 2000)
    private String dismissalNotes;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "incident_tags",
            joinColumns = @JoinColumn(name = "incident_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @org.hibernate.annotations.Cache(usage = org.hibernate.annotations.CacheConcurrencyStrategy.READ_WRITE)
    @org.hibernate.annotations.BatchSize(size = 20)
    private Set<IncidentGeneralTag> generalTags = new HashSet<>();

    // Transient field to maintain backward compatibility with existing code
    @Transient
    private List<String> tags = new ArrayList<>();

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @org.hibernate.annotations.Cache(usage = org.hibernate.annotations.CacheConcurrencyStrategy.READ_WRITE)
    @org.hibernate.annotations.BatchSize(size = 10)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    private java.util.List<Evidence> evidence;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @org.hibernate.annotations.Cache(usage = org.hibernate.annotations.CacheConcurrencyStrategy.READ_WRITE)
    @org.hibernate.annotations.BatchSize(size = 10)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    private java.util.List<Witness> witnesses;

    @Column(name = "transferred_from")
    private String transferredFrom; // stores the office code of the previous office

    @Column(name = "last_transferred_to")
    private String lastTransferredTo; // stores the office code of the most recent transfer destination

    @Column(name = "last_transfer_notes", length = 1000)
    private String lastTransferNotes;

    @Column(name = "is_anonymous")
    private Boolean isAnonymous;

    @Column(name = "prefer_anonymous")
    private Boolean preferAnonymous;

    @Column(name = "is_private")
    private Boolean isPrivate;

    @Column(name = "upvote_count")
    private Integer upvoteCount = 0;

    @Column(name = "estimated_resolution_date")
    private LocalDateTime estimatedResolutionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolution_extended_by")
    private User resolutionExtendedBy;

    @Column(name = "resolution_extended_at")
    private LocalDateTime resolutionExtendedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "is_incident")
    private Boolean isIncident = true; // Default to true (treat as incident)

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now(APP_TIMEZONE);
        if (trackingNumber == null) {
            // Generate a tracking number: INC-YYYYMMDD-XXXX (X = random alphanumeric)
            String datePart = LocalDate.now(APP_TIMEZONE).toString().replace("-", "");
            String randomPart = String.format("%04d", (int) (Math.random() * 10000));
            trackingNumber = "INC-" + datePart + "-" + randomPart;
        }
        if (upvoteCount == null) {
            upvoteCount = 0;
        }
    }
}
