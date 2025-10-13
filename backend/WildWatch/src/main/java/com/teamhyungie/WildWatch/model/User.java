package com.teamhyungie.WildWatch.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@org.hibernate.annotations.Cache(usage = org.hibernate.annotations.CacheConcurrencyStrategy.READ_WRITE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    @Column(name = "first_name")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Column(name = "last_name")
    private String lastName;

    @Column(name = "middle_initial")
    private String middleInitial;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Column(unique = true)
    private String email;

    @NotBlank(message = "School ID number is required")
    @Column(name = "school_id_number", unique = true)
    private String schoolIdNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Please provide a valid contact number")
    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "is_enabled")
    private boolean isEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Role role = Role.REGULAR_USER;

    @Column(name = "terms_accepted", nullable = false)
    private boolean termsAccepted = false;
    
    @Column(name = "terms_accepted_date")
    private LocalDateTime termsAcceptedDate;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private OfficeAdmin officeAdmin;

    @Column(name = "auth_provider")
    private String authProvider = "local";

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "verification_token_expiry")
    private LocalDateTime verificationTokenExpiry;

    @Column(name = "points")
    private Float points = 0.0f;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_rank")
    private UserRank userRank = UserRank.NONE;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getMiddleInitial() {
        return middleInitial;
    }

    public void setMiddleInitial(String middleInitial) {
        this.middleInitial = middleInitial;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSchoolIdNumber() {
        return schoolIdNumber;
    }

    public void setSchoolIdNumber(String schoolIdNumber) {
        this.schoolIdNumber = schoolIdNumber;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public boolean isEnabled() {
        return isEnabled;
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isTermsAccepted() {
        return termsAccepted;
    }
    
    public void setTermsAccepted(boolean termsAccepted) {
        this.termsAccepted = termsAccepted;
        if (termsAccepted) {
            this.termsAcceptedDate = LocalDateTime.now();
        }
    }
    
    public LocalDateTime getTermsAcceptedDate() {
        return termsAcceptedDate;
    }
    
    public void setTermsAcceptedDate(LocalDateTime termsAcceptedDate) {
        this.termsAcceptedDate = termsAcceptedDate;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public OfficeAdmin getOfficeAdmin() {
        return officeAdmin;
    }

    public void setOfficeAdmin(OfficeAdmin officeAdmin) {
        this.officeAdmin = officeAdmin;
    }

    public Office getOffice() {
        return officeAdmin != null ? Office.valueOf(officeAdmin.getOfficeCode()) : null;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
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

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }

    public LocalDateTime getVerificationTokenExpiry() {
        return verificationTokenExpiry;
    }

    public void setVerificationTokenExpiry(LocalDateTime verificationTokenExpiry) {
        this.verificationTokenExpiry = verificationTokenExpiry;
    }

    public String getResetToken() {
        return resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public LocalDateTime getResetTokenExpiry() {
        return resetTokenExpiry;
    }

    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) {
        this.resetTokenExpiry = resetTokenExpiry;
    }
} 