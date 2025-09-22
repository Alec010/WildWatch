package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.ActivityLogResponse;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.service.ActivityLogService;
import com.teamhyungie.WildWatch.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {
    private final ActivityLogService activityLogService;
    private final UserService userService;
    private final Logger logger = LoggerFactory.getLogger(ActivityLogController.class);

    @GetMapping
    public ResponseEntity<Page<ActivityLogResponse>> getUserActivityLogs(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        Page<ActivityLogResponse> logs = activityLogService.getUserActivityLogs(user, PageRequest.of(page, size))
            .map(ActivityLogResponse::fromActivityLog);
        
        logger.debug("Fetching activities for user: {}", user.getEmail());
        logger.debug("Total activities found: {}", logs.getTotalElements());
        logger.debug("Activities content size: {}", logs.getContent().size());
        
        return ResponseEntity.ok(logs);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        activityLogService.markAsRead(id, user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        activityLogService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }
} 