package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "office_bulletins")
@Data
public class OfficeBulletin {
    @Id
    @GeneratedValue(generator = "uuid")
    @GenericGenerator(name = "uuid", strategy = "uuid2")
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Media attachments
    @OneToMany(mappedBy = "bulletin", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BulletinMedia> mediaAttachments;

    // Related resolved incidents
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "bulletin_incidents",
        joinColumns = @JoinColumn(name = "bulletin_id"),
        inverseJoinColumns = @JoinColumn(name = "incident_id")
    )
    private List<Incident> relatedIncidents;
}
