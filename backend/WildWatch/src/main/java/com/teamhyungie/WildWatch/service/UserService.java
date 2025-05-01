package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.RegisterRequest;
import com.teamhyungie.WildWatch.dto.UserUpdateRequest;
import com.teamhyungie.WildWatch.model.Role;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        if (userRepository.existsBySchoolIdNumber(request.getSchoolIdNumber())) {
            throw new RuntimeException("School ID number already registered");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setMiddleInitial(request.getMiddleInitial());
        user.setEmail(request.getEmail());
        user.setSchoolIdNumber(request.getSchoolIdNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setContactNumber(request.getContactNumber());
        user.setEnabled(true);
        user.setRole(Role.REGULAR_USER);
        user.setTermsAccepted(request.isTermsAccepted());
        user.setAuthProvider("local");
        System.out.println("Creating new user with role: " + Role.REGULAR_USER);
        System.out.println("Terms accepted set to: " + request.isTermsAccepted());
        return userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public User updateUser(String email, UserUpdateRequest request) {
        User user = getUserByEmail(email);
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setMiddleInitial(request.getMiddleInitial());
        user.setContactNumber(request.getContactNumber());

        return userRepository.save(user);
    }

    public void deleteUser(String email) {
        User user = getUserByEmail(email);
        userRepository.delete(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByEmail(username)
                .orElse(null);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = getUserByEmail(email);
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User createMicrosoftOAuthUser(User user) {
        user.setAuthProvider("microsoft");
        return userRepository.save(user);
    }
} 