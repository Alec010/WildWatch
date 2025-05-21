package com.teamhyungie.WildWatch.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${frontend.url}")
    private String frontendUrl;

    public void sendVerificationEmail(String to, String token) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        
        helper.setTo(to);
        helper.setSubject("Verify your WildWatch account");
        helper.setText("""
            <html>
            <body>
                <h2>Welcome to WildWatch!</h2>
                <p>Please click the link below to verify your email address:</p>
                <p><a href="%s">Verify Email</a></p>
                <p>This link will expire in 24 hours.</p>
            </body>
            </html>
            """.formatted(verificationLink), true);
        
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String to, String token) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        
        helper.setTo(to);
        helper.setSubject("Reset your WildWatch password");
        helper.setText("""
            <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>You have requested to reset your password. Click the link below to set a new password:</p>
                <p><a href="%s">Reset Password</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this password reset, please ignore this email.</p>
            </body>
            </html>
            """.formatted(resetLink), true);
        
        mailSender.send(message);
    }
} 