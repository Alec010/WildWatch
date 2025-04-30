package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.Role;
import com.teamhyungie.WildWatch.service.OfficeAdminService;
import com.teamhyungie.WildWatch.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.teamhyungie.WildWatch.dto.OfficeAdminUserResponse;

@RestController
@RequestMapping("/api/setup")
public class OfficeAdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private OfficeAdminService officeAdminService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/create-office-admin")
    public ResponseEntity<?> createOfficeAdmin(@RequestBody OfficeAdminRequest request) {
        try {
            // Check if user already exists using existsByEmail
            if (userService.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body("User with this email already exists");
            }

            // Create and save user first
            User user = new User();
            user.setFirstName(request.getOfficeName()); // Using office name as first name
            user.setLastName("Admin"); // Default last name
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setSchoolIdNumber(request.getSchoolIdNumber());
            user.setContactNumber(request.getContactNumber());
            user.setRole(Role.OFFICE_ADMIN);
            user.setEnabled(true);
            user.setTermsAccepted(true);
            User savedUser = userService.save(user);

            // Then create and save office admin
            OfficeAdmin officeAdmin = new OfficeAdmin();
            officeAdmin.setUser(savedUser);
            officeAdmin.setOfficeName(request.getOfficeName());
            officeAdmin.setOfficeCode(request.getOfficeCode());
            officeAdmin.setOfficeDescription(request.getOfficeDescription());
            officeAdmin.setActive(true);
            officeAdminService.save(officeAdmin);

            return ResponseEntity.ok().body("Office admin account created successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create office admin account: " + e.getMessage());
        }
    }

    @GetMapping("/by-office/{officeCode}")
    public ResponseEntity<OfficeAdminUserResponse> getOfficeAdminByOfficeCode(@PathVariable String officeCode) {
        return officeAdminService.findByOfficeCode(officeCode)
            .map(officeAdmin -> {
                User user = officeAdmin.getUser();
                OfficeAdminUserResponse dto = new OfficeAdminUserResponse();
                dto.setFirstName(user.getFirstName());
                dto.setLastName(user.getLastName());
                dto.setEmail(user.getEmail());
                dto.setContactNumber(user.getContactNumber());
                return ResponseEntity.ok(dto);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Request DTO class
    public static class OfficeAdminRequest {
        private String email;
        private String password;
        private String officeName;
        private String officeCode;
        private String officeDescription;
        private String contactNumber;
        private String schoolIdNumber;

        // Getters and Setters
        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
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

        public String getContactNumber() {
            return contactNumber;
        }

        public void setContactNumber(String contactNumber) {
            this.contactNumber = contactNumber;
        }

        public String getSchoolIdNumber() {
            return schoolIdNumber;
        }

        public void setSchoolIdNumber(String schoolIdNumber) {
            this.schoolIdNumber = schoolIdNumber;
        }
    }
} 