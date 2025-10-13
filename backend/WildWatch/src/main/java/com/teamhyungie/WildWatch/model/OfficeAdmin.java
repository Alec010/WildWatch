package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;

@Entity
@Table(name = "office_admins")
public class OfficeAdmin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "office_name", nullable = false)
    private String officeName;

    @Column(name = "office_code", nullable = false, unique = true)
    private String officeCode;

    @Column(name = "office_description")
    private String officeDescription;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "points")
    private Float points = 0.0f;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_rank")
    private UserRank userRank = UserRank.NONE;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getOfficeName() {
        return officeName;
    }

    public void setOfficeName(String officeName) {
        this.officeName = officeName;
    }

    public String getOfficeCode() {
        return officeCode;
    }

    public void setOfficeCode(String officeCode) {
        this.officeCode = officeCode;
    }

    public String getOfficeDescription() {
        return officeDescription;
    }

    public void setOfficeDescription(String officeDescription) {
        this.officeDescription = officeDescription;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Float getPoints() {
        return points;
    }

    public void setPoints(Float points) {
        this.points = points;
    }

    public UserRank getUserRank() {
        return userRank;
    }

    public void setUserRank(UserRank userRank) {
        this.userRank = userRank;
    }
} 