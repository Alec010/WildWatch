package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.NotificationResponse;
import com.teamhyungie.WildWatch.model.BulletinNotification;
import com.teamhyungie.WildWatch.model.BulletinUpvote;
import com.teamhyungie.WildWatch.model.OfficeBulletin;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.repository.BulletinNotificationRepository;
import com.teamhyungie.WildWatch.repository.BulletinUpvoteRepository;
import com.teamhyungie.WildWatch.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BulletinNotificationService {

    private final BulletinNotificationRepository notificationRepository;
    private final BulletinUpvoteRepository upvoteRepository;
    private final UserService userService;
    private final ActivityLogService activityLogService;
    private final SimpMessagingTemplate messagingTemplate;
    private static final int MAX_DISPLAYED_UPVOTERS = 3;

    /**
     * Process a bulletin upvote and create/update notifications
     */
    @Transactional
    public void processUpvote(BulletinUpvote upvote) {
        OfficeBulletin bulletin = upvote.getBulletin();
        User upvoter = upvote.getUser();
        User recipient = bulletin.getCreatedBy();
        
        // Don't create notifications for self-upvotes
        if (upvoter.getId().equals(recipient.getId())) {
            return;
        }
        
        // Check if this is the first upvote or if there are existing upvotes
        List<BulletinUpvote> existingUpvotes = upvoteRepository.findByBulletinOrderByCreatedAtDesc(bulletin);
        int upvoteCount = existingUpvotes.size();
        
        // Create notification message based on upvote count
        String notificationMessage;
        if (upvoteCount == 1) {
            // First upvote
            notificationMessage = upvoter.getFirstName() + " " + upvoter.getLastName() + 
                " upvoted your bulletin \"" + bulletin.getTitle() + "\"";
        } else {
            // Multiple upvotes - show latest upvoter and count
            int othersCount = upvoteCount - 1;
            notificationMessage = upvoter.getFirstName() + " " + upvoter.getLastName() + 
                " and " + othersCount + " other" + (othersCount > 1 ? "s" : "") + 
                " upvoted your bulletin \"" + bulletin.getTitle() + "\"";
        }
        
        // Use existing ActivityLog system for notifications
        activityLogService.logActivity(
            "BULLETIN_UPVOTE",
            notificationMessage,
            null, // No incident associated with bulletin upvotes
            recipient
        );
        
        System.out.println("Created bulletin upvote notification for user: " + recipient.getEmail());
    }
    
    /**
     * Remove an upvote notification when upvote is removed
     */
    @Transactional
    public void processUpvoteRemoval(BulletinUpvote upvote) {
        OfficeBulletin bulletin = upvote.getBulletin();
        User upvoter = upvote.getUser();
        User recipient = bulletin.getCreatedBy();
        
        // Check remaining upvotes after removal
        List<BulletinUpvote> remainingUpvotes = upvoteRepository.findByBulletinOrderByCreatedAtDesc(bulletin);
        int remainingCount = remainingUpvotes.size();
        
        if (remainingCount > 0) {
            // Still have upvotes, create updated notification
            User latestUpvoter = remainingUpvotes.get(0).getUser();
            String notificationMessage;
            
            if (remainingCount == 1) {
                notificationMessage = latestUpvoter.getFirstName() + " " + latestUpvoter.getLastName() + 
                    " upvoted your bulletin \"" + bulletin.getTitle() + "\"";
            } else {
                int othersCount = remainingCount - 1;
                notificationMessage = latestUpvoter.getFirstName() + " " + latestUpvoter.getLastName() + 
                    " and " + othersCount + " other" + (othersCount > 1 ? "s" : "") + 
                    " upvoted your bulletin \"" + bulletin.getTitle() + "\"";
            }
            
            // Create updated notification
            activityLogService.logActivity(
                "BULLETIN_UPVOTE_UPDATE",
                notificationMessage,
                null,
                recipient
            );
        }
        // If no remaining upvotes, we don't create a notification (the upvote was removed)
        
        System.out.println("Processed upvote removal for bulletin: " + bulletin.getTitle());
    }
    
    /**
     * Get notifications for a user
     */
    public List<NotificationResponse> getUserNotifications(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        
        // Debug: Check all notifications in the database
        List<BulletinNotification> allNotifications = notificationRepository.findAll();
        System.out.println("Total notifications in database: " + allNotifications.size());
        
        List<BulletinNotification> notifications = notificationRepository
            .findByRecipientOrderByUpdatedAtDesc(user);
        
        // Debug logging
        System.out.println("Found " + notifications.size() + " notifications for user: " + userEmail);
        for (BulletinNotification notification : notifications) {
            System.out.println("Notification ID: " + notification.getId() + ", Type: " + notification.getNotificationType() + ", Read: " + notification.getIsRead());
        }
        
        return notifications.stream()
            .map(this::mapToNotificationResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get paginated notifications for a user
     */
    public Page<NotificationResponse> getUserNotificationsPaginated(String userEmail, int page, int size) {
        User user = userService.getUserByEmail(userEmail);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<BulletinNotification> notifications = notificationRepository
            .findByRecipientOrderByUpdatedAtDesc(user, pageable);
        
        return notifications.map(this::mapToNotificationResponse);
    }
    
    /**
     * Mark notifications as read
     */
    @Transactional
    public void markAsRead(String notificationId, String userEmail) {
        BulletinNotification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Verify user owns this notification
        if (!notification.getRecipient().getEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to mark this notification as read");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
    
    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        
        List<BulletinNotification> notifications = notificationRepository
            .findByRecipientAndIsReadFalseOrderByUpdatedAtDesc(user);
        
        notifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }
    
    /**
     * Count unread notifications for a user
     */
    public int countUnreadNotifications(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        
        return notificationRepository.countUnreadNotifications(user);
    }
    
    /**
     * Send real-time notification via WebSocket
     */
    private void sendRealTimeNotification(BulletinNotification notification) {
        NotificationResponse response = mapToNotificationResponse(notification);
        messagingTemplate.convertAndSend(
            "/topic/notifications/" + notification.getRecipient().getId(), 
            response
        );
    }
    
    /**
     * Map notification entity to DTO
     */
    private NotificationResponse mapToNotificationResponse(BulletinNotification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setType(notification.getNotificationType().name());
        response.setBulletinId(notification.getBulletin().getId());
        response.setBulletinTitle(notification.getBulletin().getTitle());
        response.setCreatedAt(notification.getCreatedAt());
        response.setUpdatedAt(notification.getUpdatedAt());
        response.setIsRead(notification.getIsRead());
        response.setUpvoteCount(notification.getUpvoteCount());
        
        // Set latest upvoter info
        if (notification.getLatestUpvoter() != null) {
            User latestUpvoter = notification.getLatestUpvoter();
            response.setLatestUpvoterId(latestUpvoter.getId().toString());
            response.setLatestUpvoterName(latestUpvoter.getFirstName() + " " + latestUpvoter.getLastName());
        }
        
        // Set recent upvoters list
        response.setRecentUpvoterIds(notification.getRecentUpvoterIds());
        
        return response;
    }
}
