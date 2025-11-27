package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.FollowUpResponse;
import com.teamhyungie.WildWatch.model.FollowUpRecord;
import com.teamhyungie.WildWatch.model.Incident;
import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.repository.FollowUpRecordRepository;
import com.teamhyungie.WildWatch.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import static com.teamhyungie.WildWatch.config.TimezoneConfig.APP_TIMEZONE;

@Service
public class FollowUpService {

    @Autowired
    private FollowUpRecordRepository followUpRecordRepository;
    
    @Autowired
    private IncidentRepository incidentRepository;
    
    @Autowired
    private ActivityLogService activityLogService;
    
    @Autowired
    private OfficeAdminService officeAdminService;

    /**
     * Create a follow-up request for an incident
     * 
     * @param incidentId The ID of the incident
     * @param userEmail The email of the user creating the follow-up
     * @return FollowUpResponse with success status and next available time
     */
    @Transactional
    public FollowUpResponse createFollowUp(String incidentId, String userEmail) {
        // Find the incident
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
        
        // Find the user
        User user = incident.getSubmittedBy();
        
        // Verify the user is the owner of the incident
        if (!user.getEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to create follow-up for this incident");
        }
        
        // Check if user has already sent a follow-up in the last 24 hours
        LocalDateTime oneDayAgo = LocalDateTime.now(APP_TIMEZONE).minusHours(24);
        boolean hasRecentFollowUp = followUpRecordRepository.existsByUserAndIncidentAndCreatedAtAfter(user, incident, oneDayAgo);
        
        if (hasRecentFollowUp) {
            // Find the most recent follow-up to calculate next available time
            Optional<FollowUpRecord> lastFollowUp = followUpRecordRepository.findTopByUserAndIncidentOrderByCreatedAtDesc(user, incident);
            LocalDateTime nextAvailableTime = lastFollowUp.map(record -> record.getCreatedAt().plusHours(24)).orElse(null);
            
            return FollowUpResponse.error("You can only send one follow-up per day", nextAvailableTime);
        }
        
        // Create a new follow-up record
        FollowUpRecord followUpRecord = new FollowUpRecord(incident, user);
        followUpRecordRepository.save(followUpRecord);
        
        // Create activity log for the office admin
        if (incident.getAssignedOffice() != null) {
            // Find the office admin for the assigned office
            Optional<OfficeAdmin> officeAdmin = officeAdminService.findByOfficeCode(incident.getAssignedOffice().name());
            
            if (officeAdmin.isPresent()) {
                User adminUser = officeAdmin.get().getUser();
                
                // Log activity for the office admin
                activityLogService.logActivity(
                    "FOLLOW_UP",
                    "Follow-up request for case #" + incident.getTrackingNumber() + " from " + user.getFirstName() + " " + user.getLastName(),
                    incident,
                    adminUser
                );
            }
        }
        
        // Calculate next available time
        LocalDateTime nextAvailableTime = LocalDateTime.now(APP_TIMEZONE).plusHours(24);
        
        return FollowUpResponse.success(nextAvailableTime);
    }
}
