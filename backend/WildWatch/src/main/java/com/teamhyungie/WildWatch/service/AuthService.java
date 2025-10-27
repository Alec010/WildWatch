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
        return AuthResponse.builder()
                .token(token)
                .termsAccepted(false)
                .message("User registered successfully. Please check your email to verify your account.")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // First authenticate the user
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Get the user and check if email is verified
        User user = userService.getUserByEmail(request.getEmail());
        if (!user.isEnabled()) {
            throw new RuntimeException("Please verify your email before logging in. Check your inbox for the verification link.");
        }

        // Generate token only if email is verified
        String token = jwtUtil.generateToken(userDetailsService.loadUserByUsername(user.getEmail()));
        return AuthResponse.builder()
                .token(token)
                .termsAccepted(user.isTermsAccepted())
                .message("Login successful")
                .build();
    }

    public Map<String, Object> getUserProfile(String email) {
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
        // Add office code and office points for office admins
        if (user.getRole().toString().equals("OFFICE_ADMIN") && user.getOfficeAdmin() != null) {
            profile.put("officeCode", user.getOfficeAdmin().getOfficeCode());
            profile.put("points", user.getOfficeAdmin().getPoints());
        }
        return profile;
    }
} 