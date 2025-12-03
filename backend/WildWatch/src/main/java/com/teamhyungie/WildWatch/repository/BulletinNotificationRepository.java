package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.BulletinNotification;
import com.teamhyungie.WildWatch.model.OfficeBulletin;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BulletinNotificationRepository extends JpaRepository<BulletinNotification, String> {
    
    Optional<BulletinNotification> findByBulletinAndRecipientAndNotificationType(
        OfficeBulletin bulletin, 
        User recipient, 
        BulletinNotification.NotificationType notificationType
    );
    
    List<BulletinNotification> findByRecipientOrderByUpdatedAtDesc(User recipient);
    
    Page<BulletinNotification> findByRecipientOrderByUpdatedAtDesc(User recipient, Pageable pageable);
    
    List<BulletinNotification> findByRecipientAndIsReadFalseOrderByUpdatedAtDesc(User recipient);
    
    @Query("SELECT COUNT(bn) FROM BulletinNotification bn WHERE bn.recipient = :recipient AND bn.isRead = false")
    int countUnreadNotifications(@Param("recipient") User recipient);
    
    void deleteByBulletin(OfficeBulletin bulletin);
}
