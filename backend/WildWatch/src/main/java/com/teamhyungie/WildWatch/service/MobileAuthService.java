package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MobileAuthService {

    private final UserService userService;

    /**
     * Get user profile with mobile-specific fields (passwordNeedsSetup, etc.)
     * This is separate from web AuthService to keep concerns separated
     */
    public Map<String, Object> getMobileUserProfile(String email) {
        User user = userService.getUserByEmail(email);

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("email", user.getEmail());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("middleInitial", user.getMiddleInitial());
        profile.put("schoolIdNumber", user.getSchoolIdNumber());
        profile.put("contactNumber", user.getContactNumber());
        profile.put("role", user.getRole().toString());
        profile.put("termsAccepted", user.isTermsAccepted());
        profile.put("enabled", user.isEnabled());
        profile.put("points", user.getPoints());
        profile.put("authProvider", user.getAuthProvider() != null ? user.getAuthProvider() : "local");
        
        // For Microsoft OAuth mobile users, check if password needs setup
        // Temporary passwords are UUID-based (36 chars, no $), hashed passwords start with $ (60+ chars)
        if (user.getAuthProvider() != null && 
            (user.getAuthProvider().equals("microsoft") || user.getAuthProvider().equals("microsoft_mobile"))) {
            String userPassword = user.getPassword();
            boolean passwordNeedsSetup = false;
            if (userPassword != null) {
                // Hashed passwords start with $ and are typically 60+ characters long
                // Temporary passwords are UUID-based (32 chars) + "Aa1!" = 36 chars
                passwordNeedsSetup = !userPassword.startsWith("$") && userPassword.length() <= 40;
            } else {
                passwordNeedsSetup = true;
            }
            profile.put("passwordNeedsSetup", passwordNeedsSetup);
            profile.put("password", passwordNeedsSetup ? null : "set"); // Return null if needs setup, "set" if already set
        } else {
            profile.put("passwordNeedsSetup", false);
            profile.put("password", "set");
        }
        
        // Add office code and office points for office admins
        if (user.getRole().toString().equals("OFFICE_ADMIN") && user.getOfficeAdmin() != null) {
            profile.put("officeCode", user.getOfficeAdmin().getOfficeCode());
            profile.put("points", user.getOfficeAdmin().getPoints());
        }
        
        return profile;
    }
}

