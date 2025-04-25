package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.ActivityLogResponse;
import com.teamhyungie.WildWatch.model.ActivityLog;
import com.teamhyungie.WildWatch.service.ActivityLogService;
import com.teamhyungie.WildWatch.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ActivityLogController {
    private final ActivityLogService activityLogService;
    private final UserService userService;
    private final Logger logger = LoggerFactory.getLogger(ActivityLogController.class);

    @GetMapping("/my-activities")
    public ResponseEntity<Page<ActivityLogResponse>> getUserActivities(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var user = userService.getUserByEmail(userDetails.getUsername());
        var pageable = PageRequest.of(page, size);
        var activitiesPage = activityLogService.getUserActivityLogs(user, pageable);
        
        List<ActivityLogResponse> activityResponses = activitiesPage.getContent()
            .stream()
            .map(ActivityLogResponse::fromActivityLog)
            .collect(Collectors.toList());

        Page<ActivityLogResponse> responsePage = new PageImpl<>(
            activityResponses,
            pageable,
            activitiesPage.getTotalElements()
        );
        
        logger.info("Fetching activities for user: {}", user.getEmail());
        logger.info("Total activities found: {}", responsePage.getTotalElements());
        logger.info("Activities content size: {}", responsePage.getContent().size());
        
        return ResponseEntity.ok(responsePage);
    }
} 