package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.CreateBulletinRequest;
import com.teamhyungie.WildWatch.dto.OfficeBulletinResponse;
import com.teamhyungie.WildWatch.dto.ResolvedIncidentResponse;
import com.teamhyungie.WildWatch.model.BulletinMedia;
import com.teamhyungie.WildWatch.model.BulletinUpvote;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.Office;
import com.teamhyungie.WildWatch.model.OfficeBulletin;
import com.teamhyungie.WildWatch.model.Role;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.repository.BulletinMediaRepository;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import com.teamhyungie.WildWatch.repository.BulletinUpvoteRepository;
import com.teamhyungie.WildWatch.repository.OfficeBulletinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfficeBulletinService {

    private final OfficeBulletinRepository officeBulletinRepository;
    private final BulletinMediaRepository bulletinMediaRepository;
    private final IncidentRepository incidentRepository;
    private final BulletinUpvoteRepository bulletinUpvoteRepository;
    private final ActivityLogService activityLogService;
    private final OfficeAdminService officeAdminService;
    private final UserService userService;
    private final SupabaseStorageService supabaseStorageService;

    @Transactional
    public OfficeBulletinResponse createBulletin(CreateBulletinRequest request, String userEmail, List<MultipartFile> mediaFiles) {
        // Validate user is office admin
        User user = userService.getUserByEmail(userEmail);
        if (!user.getRole().equals(Role.OFFICE_ADMIN)) {
            throw new RuntimeException("Only office admins can create bulletins");
        }

        // Create bulletin entity
        OfficeBulletin bulletin = new OfficeBulletin();
        bulletin.setTitle(request.getTitle());
        bulletin.setDescription(request.getDescription());
        bulletin.setCreatedBy(user);
        bulletin.setCreatedAt(LocalDateTime.now());
        bulletin.setIsActive(true);

        // Handle related incidents
        if (request.getSelectedIncidents() != null && !request.getSelectedIncidents().isEmpty()) {
            List<Incident> incidents = incidentRepository.findAllById(request.getSelectedIncidents());
            // Filter only resolved incidents
            incidents = incidents.stream()
                .filter(incident -> {
                    String status = incident.getStatus();
                    return status != null && (
                        "resolved".equalsIgnoreCase(status) || 
                        "closed".equalsIgnoreCase(status)
                    );
                })
                .collect(Collectors.toList());
            bulletin.setRelatedIncidents(incidents);
        }

        // Save bulletin first to get ID
        bulletin = officeBulletinRepository.save(bulletin);

        // Handle media uploads
        List<BulletinMedia> mediaAttachments = new ArrayList<>();
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            for (MultipartFile file : mediaFiles) {
                if (!file.isEmpty()) {
                    try {
                        // Upload file to Supabase Storage
                        String fileUrl = supabaseStorageService.storeFile(file);
                        
                        BulletinMedia media = new BulletinMedia();
                        media.setBulletin(bulletin);
                        media.setFileName(file.getOriginalFilename());
                        media.setFileUrl(fileUrl);
                        media.setFileType(file.getContentType());
                        media.setFileSize(file.getSize());
                        media.setUploadedAt(LocalDateTime.now());
                        
                        mediaAttachments.add(bulletinMediaRepository.save(media));
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename(), e);
                    }
                }
            }
        }
        bulletin.setMediaAttachments(mediaAttachments);

        return mapToBulletinResponse(bulletin);
    }

    public List<OfficeBulletinResponse> getAllActiveBulletins(String userEmail) {
        List<OfficeBulletin> bulletins = officeBulletinRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        List<String> upvotedIds = null;
        try {
            User user = userService.getUserByEmail(userEmail);
            upvotedIds = bulletinUpvoteRepository.findUpvotedBulletinIdsByUserId(user.getId());
        } catch (Exception ignored) {}
        final java.util.Set<String> upvotedSet = upvotedIds != null ? new java.util.HashSet<>(upvotedIds) : java.util.Collections.emptySet();
        return bulletins.stream()
            .map(b -> {
                OfficeBulletinResponse resp = mapToBulletinResponse(b);
                resp.setUserHasUpvoted(upvotedSet.contains(b.getId()));
                return resp;
            })
            .collect(Collectors.toList());
    }

    public List<OfficeBulletinResponse> getBulletinsByCreator(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        List<OfficeBulletin> bulletins = officeBulletinRepository.findByCreatedByAndIsActiveTrueOrderByCreatedAtDesc(user);
        List<String> upvotedIds = bulletinUpvoteRepository.findUpvotedBulletinIdsByUserId(user.getId());
        final java.util.Set<String> upvotedSet = new java.util.HashSet<>(upvotedIds);
        return bulletins.stream()
            .map(b -> {
                OfficeBulletinResponse resp = mapToBulletinResponse(b);
                resp.setUserHasUpvoted(upvotedSet.contains(b.getId()));
                return resp;
            })
            .collect(Collectors.toList());
    }

    public List<ResolvedIncidentResponse> getResolvedIncidents(String userEmail) {
        // Get resolved incidents for the specific office
        User user = userService.getUserByEmail(userEmail);
        Office userOffice = user.getOffice();
        
        if (userOffice == null) {
            throw new RuntimeException("User is not associated with any office");
        }
        
        // Get all incidents for the office first
        List<Incident> allOfficeIncidents = incidentRepository.findByAssignedOfficeOrderBySubmittedAtDesc(userOffice);
        
        // Filter for resolved incidents and map to DTO
        return allOfficeIncidents.stream()
            .filter(incident -> {
                String status = incident.getStatus();
                return status != null && (
                    "resolved".equalsIgnoreCase(status) || 
                    "closed".equalsIgnoreCase(status)
                );
            })
            .map(this::mapToResolvedIncidentResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public boolean toggleUpvote(String bulletinId, String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        OfficeBulletin bulletin = officeBulletinRepository.findById(bulletinId)
            .orElseThrow(() -> new RuntimeException("Bulletin not found"));

        if (bulletin.getUpvoteCount() == null) {
            bulletin.setUpvoteCount(0);
        }

        java.util.Optional<BulletinUpvote> existing = bulletinUpvoteRepository.findByBulletinAndUser(bulletin, user);
        if (existing.isPresent()) {
            bulletinUpvoteRepository.delete(existing.get());
            bulletin.setUpvoteCount(Math.max(0, bulletin.getUpvoteCount() - 1));
            officeBulletinRepository.save(bulletin);
            // Remove point from bulletin creator's office if not self-upvote
            try {
                User creator = bulletin.getCreatedBy();
                if (creator != null && !creator.getId().equals(user.getId())) {
                    com.teamhyungie.WildWatch.model.OfficeAdmin officeAdmin = officeAdminService.findByUserEmail(creator.getEmail()).orElse(null);
                    if (officeAdmin != null) {
                        float current = officeAdmin.getPoints() != null ? officeAdmin.getPoints() : 0.0f;
                        officeAdmin.setPoints(Math.max(0.0f, current - 1.0f));
                        officeAdminService.save(officeAdmin);
                        // Removed upvote notifications
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to remove upvote points from bulletin creator: " + e.getMessage());
            }
            return false;
        } else {
            BulletinUpvote upvote = new BulletinUpvote();
            upvote.setBulletin(bulletin);
            upvote.setUser(user);
            bulletinUpvoteRepository.save(upvote);
            bulletin.setUpvoteCount(bulletin.getUpvoteCount() + 1);
            officeBulletinRepository.save(bulletin);
            // Award +1 point to bulletin creator's office if not self-upvote
            try {
                User creator = bulletin.getCreatedBy();
                if (creator != null && !creator.getId().equals(user.getId())) {
                    com.teamhyungie.WildWatch.model.OfficeAdmin officeAdmin = officeAdminService.findByUserEmail(creator.getEmail()).orElse(null);
                    if (officeAdmin != null) {
                        officeAdmin.setPoints((officeAdmin.getPoints() != null ? officeAdmin.getPoints() : 0.0f) + 1.0f);
                        officeAdminService.save(officeAdmin);
                        // Removed upvote notifications
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to award upvote points to bulletin creator: " + e.getMessage());
            }
            return true;
        }
    }

    public boolean hasUserUpvoted(String bulletinId, String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        OfficeBulletin bulletin = officeBulletinRepository.findById(bulletinId)
            .orElseThrow(() -> new RuntimeException("Bulletin not found"));
        return bulletinUpvoteRepository.existsByBulletinAndUser(bulletin, user);
    }

    private OfficeBulletinResponse mapToBulletinResponse(OfficeBulletin bulletin) {
        OfficeBulletinResponse response = new OfficeBulletinResponse();
        response.setId(bulletin.getId());
        response.setTitle(bulletin.getTitle());
        response.setDescription(bulletin.getDescription());
        response.setCreatedBy(bulletin.getCreatedBy().getFirstName() + " " + bulletin.getCreatedBy().getLastName());
        response.setCreatedAt(bulletin.getCreatedAt());
        response.setIsActive(bulletin.getIsActive());
        response.setUpvoteCount(bulletin.getUpvoteCount() != null ? bulletin.getUpvoteCount() : 0);

        // Map media attachments
        if (bulletin.getMediaAttachments() != null) {
            List<OfficeBulletinResponse.BulletinMediaResponse> mediaResponses = bulletin.getMediaAttachments().stream()
                .map(this::mapToMediaResponse)
                .collect(Collectors.toList());
            response.setMediaAttachments(mediaResponses);
        }

        // Map related incidents
        if (bulletin.getRelatedIncidents() != null) {
            List<OfficeBulletinResponse.IncidentSummaryResponse> incidentResponses = bulletin.getRelatedIncidents().stream()
                .map(this::mapToIncidentSummaryResponse)
                .collect(Collectors.toList());
            response.setRelatedIncidents(incidentResponses);
        }

        return response;
    }

    private OfficeBulletinResponse.BulletinMediaResponse mapToMediaResponse(BulletinMedia media) {
        OfficeBulletinResponse.BulletinMediaResponse response = new OfficeBulletinResponse.BulletinMediaResponse();
        response.setId(media.getId());
        response.setFileName(media.getFileName());
        response.setFileUrl(media.getFileUrl());
        response.setFileType(media.getFileType());
        response.setFileSize(media.getFileSize());
        response.setUploadedAt(media.getUploadedAt());
        return response;
    }

    private OfficeBulletinResponse.IncidentSummaryResponse mapToIncidentSummaryResponse(Incident incident) {
        OfficeBulletinResponse.IncidentSummaryResponse response = new OfficeBulletinResponse.IncidentSummaryResponse();
        response.setId(incident.getId());
        response.setTrackingNumber(incident.getTrackingNumber());
        response.setTitle(incident.getDescription());
        response.setStatus(incident.getStatus());
        return response;
    }

    private ResolvedIncidentResponse mapToResolvedIncidentResponse(Incident incident) {
        ResolvedIncidentResponse response = new ResolvedIncidentResponse();
        response.setId(incident.getId());
        response.setTrackingNumber(incident.getTrackingNumber());
        response.setDescription(incident.getDescription());
        response.setStatus(incident.getStatus());
        response.setSubmittedAt(incident.getSubmittedAt());
        response.setLocation(incident.getLocation());
        response.setIncidentType(incident.getIncidentType());
        return response;
    }
}
