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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
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
        user.setEnabled(false); // Set to false until email is verified
        user.setRole(Role.REGULAR_USER);
        user.setTermsAccepted(request.isTermsAccepted());
        user.setAuthProvider("local");

        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));

        user = userRepository.save(user);

        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationToken);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }

        return user;
    }

    @Transactional
    public boolean verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification token has expired");
        }

        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return true;
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

    @Transactional
    public void migrateExistingUsers() {
        // This method can be called once after deployment to handle existing users
        userRepository.findAll().forEach(user -> {
            if (user.getVerificationToken() == null) {
                // This is an existing user, mark them as verified
                user.setEnabled(true);
                userRepository.save(user);
            }
        });
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Generate reset token
        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage());
        }
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
} 