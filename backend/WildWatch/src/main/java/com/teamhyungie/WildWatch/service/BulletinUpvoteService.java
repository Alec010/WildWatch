package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.BulletinUpvote;
import com.teamhyungie.WildWatch.model.OfficeBulletin;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.repository.BulletinUpvoteRepository;
import com.teamhyungie.WildWatch.repository.OfficeBulletinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BulletinUpvoteService {

    private final BulletinUpvoteRepository upvoteRepository;
    private final OfficeBulletinRepository bulletinRepository;
    private final UserService userService;
    private final BulletinNotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Toggle upvote for a bulletin
     * @return true if upvoted, false if removed
     */
    @Transactional
    public boolean toggleUpvote(String bulletinId, String userEmail) {
        OfficeBulletin bulletin = bulletinRepository.findById(bulletinId)
            .orElseThrow(() -> new RuntimeException("Bulletin not found"));
        
        User user = userService.getUserByEmail(userEmail);
        
        Optional<BulletinUpvote> existingUpvote = upvoteRepository.findByBulletinAndUser(bulletin, user);
        
        if (existingUpvote.isPresent()) {
            // Remove upvote
            BulletinUpvote upvote = existingUpvote.get();
            upvoteRepository.delete(upvote);
            
            // Update bulletin upvote count
            bulletin.setUpvoteCount(Math.max(0, bulletin.getUpvoteCount() - 1));
            bulletinRepository.save(bulletin);
            
            // Process notification for upvote removal
            notificationService.processUpvoteRemoval(upvote);
            
            // Send real-time update
            messagingTemplate.convertAndSend("/topic/bulletins/" + bulletinId + "/upvotes", bulletin.getUpvoteCount());
            
            return false;
        } else {
            // Add upvote
            BulletinUpvote upvote = new BulletinUpvote(bulletin, user);
            upvoteRepository.save(upvote);
            
            // Update bulletin upvote count
            bulletin.setUpvoteCount(bulletin.getUpvoteCount() + 1);
            bulletinRepository.save(bulletin);
            
            // Process notification for new upvote
            notificationService.processUpvote(upvote);
            
            // Send real-time update
            messagingTemplate.convertAndSend("/topic/bulletins/" + bulletinId + "/upvotes", bulletin.getUpvoteCount());
            
            return true;
        }
    }
    
    /**
     * Check if user has upvoted a bulletin
     */
    public boolean hasUserUpvoted(String bulletinId, String userEmail) {
        OfficeBulletin bulletin = bulletinRepository.findById(bulletinId)
            .orElseThrow(() -> new RuntimeException("Bulletin not found"));
        
        User user = userService.getUserByEmail(userEmail);
        
        return upvoteRepository.existsByBulletinAndUser(bulletin, user);
    }
    
    /**
     * Get upvote count for a bulletin
     */
    public int getUpvoteCount(String bulletinId) {
        OfficeBulletin bulletin = bulletinRepository.findById(bulletinId)
            .orElseThrow(() -> new RuntimeException("Bulletin not found"));
        
        return bulletin.getUpvoteCount();
    }
}
