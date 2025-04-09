package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Table(name = "witnesses")
@Data
public class Witness {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    private Incident incident;

    @NotBlank(message = "Witness name is required")
    private String name;

    @Column(name = "contact_information")
    private String contactInformation;

    @Column(name = "statement", length = 1000)
    private String statement;
} 