package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.UserResponse;
import com.teamhyungie.WildWatch.dto.UserSearchResponse;
import com.teamhyungie.WildWatch.dto.UserUpdateRequest;
import com.teamhyungie.WildWatch.dto.ChangePasswordRequest;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
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

    @PostMapping("/me/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request
    ) {
        try {
            userService.changePassword(authentication.getName(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok().body("Password changed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Search for users by name or email
     * This endpoint is used for @mention functionality in the witness section
     * 
     * @param query The search term to match against name or email
     * @param page Page number (zero-based)
     * @param size Number of results per page
     * @return Paginated list of matching users with minimal information
     */
    @GetMapping("/search")
    public ResponseEntity<Page<UserSearchResponse>> searchUsers(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // Create pageable request with sorting by name
        Pageable pageable = PageRequest.of(page, size, Sort.by("firstName").ascending());
        
        // Get search results from service
        Page<User> users = userService.searchUsers(query, pageable);
        
        // Map to DTOs
        Page<UserSearchResponse> response = users.map(UserSearchResponse::fromUser);
        
        return ResponseEntity.ok(response);
    }
} 