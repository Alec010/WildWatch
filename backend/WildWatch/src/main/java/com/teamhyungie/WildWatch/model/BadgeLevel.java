package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing a level of a badge with specific requirements
 */
@Entity
@Table(name = "badge_levels")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BadgeLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false)
    private Integer requirement;

    @Column(nullable = false)
    private String description;
}




