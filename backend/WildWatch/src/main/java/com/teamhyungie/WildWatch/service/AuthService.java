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
        // Ensure terms_accepted is false for new users
        user.setTermsAccepted(false);
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
        
        if (!termsAccepted) {
            System.out.println("User has not accepted terms, redirecting to terms page");
        }
        
        return AuthResponse.builder()
                .token(token)
                .termsAccepted(termsAccepted)
                .message("Login successful")
                .build();
    }

    public Map<String, String> getUserProfile(String email) {
        User user = userService.findByUsername(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Map<String, String> profile = new HashMap<>();
        // Combine first name, middle initial, and last name
        String fullName = user.getFirstName();
        if (user.getMiddleInitial() != null && !user.getMiddleInitial().isEmpty()) {
            fullName += " " + user.getMiddleInitial() + ".";
        }
        fullName += " " + user.getLastName();
        
        profile.put("fullName", fullName);
        profile.put("idNumber", user.getSchoolIdNumber());
        profile.put("email", user.getEmail());
        return profile;
    }
} 