package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entity representing a witness to an incident
 * Can be either a registered user (referenced by userId) or an external person (with manual name entry)
 */
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
    
    /**
     * Optional reference to a registered user
     * When this is set, the name and contact information should be derived from the user
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    /**
     * Manual name entry for non-registered witnesses
     * This will be null if user is set
     */
    private String name;

    /**
     * Manual contact information for non-registered witnesses
     * This will be null if user is set
     */
    @Column(name = "contact_information")
    private String contactInformation;

    /**
     * Additional notes about the witness's account
     * This applies to both registered and non-registered witnesses
     */
    @Column(name = "additional_notes", length = 1000)
    private String additionalNotes;
    
    /**
     * Get the name of the witness, either from the user record or the manual entry
     * @return The witness's name
     */
    @Transient
    public String getDisplayName() {
        if (user != null) {
            return user.getFullName();
        }
        return name;
    }
    
    /**
     * Get the contact information of the witness, either from the user record or the manual entry
     * @return The witness's contact information
     */
    @Transient
    public String getDisplayContactInformation() {
        if (user != null) {
            return user.getEmail();
        }
        return contactInformation;
    }
} 