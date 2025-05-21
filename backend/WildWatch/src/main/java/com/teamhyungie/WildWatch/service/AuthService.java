package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.AuthResponse;
import com.teamhyungie.WildWatch.dto.LoginRequest;
import com.teamhyungie.WildWatch.dto.RegisterRequest;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthResponse register(RegisterRequest request) {
        User user = userService.registerUser(request);
        user = userService.save(user);
        
        String token = jwtUtil.generateToken(userDetailsService.loadUserByUsername(user.getEmail()));
        System.out.println("New user registered - Token: " + token);
        return AuthResponse.builder()
                .token(token)
                .termsAccepted(false)
                .message("User registered successfully")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        
        // Get the user and check terms acceptance status
        User user = userService.findByUsername(request.getEmail());
        boolean termsAccepted = user.isTermsAccepted();
        
        System.out.println("User logged in - Email: " + request.getEmail());
        System.out.println("Generated Token: " + token);
        System.out.println("Terms Accepted: " + termsAccepted);
        
        // Create user data map
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("email", user.getEmail());
        userData.put("firstName", user.getFirstName());
        userData.put("lastName", user.getLastName());
        userData.put("middleInitial", user.getMiddleInitial());
        userData.put("schoolIdNumber", user.getSchoolIdNumber());
        userData.put("contactNumber", user.getContactNumber());
        userData.put("role", user.getRole().toString());
        userData.put("termsAccepted", user.isTermsAccepted());
        userData.put("enabled", user.isEnabled());
        
        return AuthResponse.builder()
                .token(token)
                .termsAccepted(termsAccepted)
                .message("Login successful")
                .user(userData)
                .build();
    }

    public Map<String, Object> getUserProfile(String email) {
        User user = userService.findByUsername(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

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
        // Add office code and office points for office admins
        if (user.getRole().toString().equals("OFFICE_ADMIN") && user.getOfficeAdmin() != null) {
            profile.put("officeCode", user.getOfficeAdmin().getOfficeCode());
            profile.put("points", user.getOfficeAdmin().getPoints());
        }
        return profile;
    }
} 