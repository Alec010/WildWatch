package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.UserResponse;
import com.teamhyungie.WildWatch.dto.UserUpdateRequest;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            Authentication authentication,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        User updatedUser = userService.updateUser(authentication.getName(), request);
        return ResponseEntity.ok(UserResponse.fromUser(updatedUser));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentUser(Authentication authentication) {
        userService.deleteUser(authentication.getName());
        return ResponseEntity.noContent().build();
    }
} 