package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.CreateBulletinRequest;
import com.teamhyungie.WildWatch.dto.OfficeBulletinResponse;
import com.teamhyungie.WildWatch.dto.ResolvedIncidentResponse;
import com.teamhyungie.WildWatch.service.OfficeBulletinService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/office-bulletins")
@RequiredArgsConstructor
public class OfficeBulletinController {

    private final OfficeBulletinService officeBulletinService;

    @PostMapping
    public ResponseEntity<OfficeBulletinResponse> createBulletin(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam(value = "selectedIncidents", required = false) List<String> selectedIncidents,
            @RequestParam(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        CreateBulletinRequest request = new CreateBulletinRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setSelectedIncidents(selectedIncidents);
        
        OfficeBulletinResponse response = officeBulletinService.createBulletin(
            request, 
            userDetails.getUsername(), 
            mediaFiles
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OfficeBulletinResponse>> getAllBulletins(@AuthenticationPrincipal UserDetails userDetails) {
        List<OfficeBulletinResponse> bulletins = officeBulletinService.getAllActiveBulletins(userDetails.getUsername());
        return ResponseEntity.ok(bulletins);
    }

    @GetMapping("/my-bulletins")
    public ResponseEntity<List<OfficeBulletinResponse>> getMyBulletins(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<OfficeBulletinResponse> bulletins = officeBulletinService.getBulletinsByCreator(userDetails.getUsername());
        return ResponseEntity.ok(bulletins);
    }

    @GetMapping("/resolved-incidents")
    public ResponseEntity<List<ResolvedIncidentResponse>> getResolvedIncidents(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ResolvedIncidentResponse> incidents = officeBulletinService.getResolvedIncidents(userDetails.getUsername());
        return ResponseEntity.ok(incidents);
    }

    @PostMapping("/{id}/upvote")
    public ResponseEntity<Boolean> toggleUpvote(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isUpvoted = officeBulletinService.toggleUpvote(id, userDetails.getUsername());
        return ResponseEntity.ok(isUpvoted);
    }

    @GetMapping("/{id}/upvote-status")
    public ResponseEntity<Boolean> getUpvoteStatus(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean hasUpvoted = officeBulletinService.hasUserUpvoted(id, userDetails.getUsername());
        return ResponseEntity.ok(hasUpvoted);
    }
}
