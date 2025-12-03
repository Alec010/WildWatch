package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.OfficeBulletin;
import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfficeBulletinRepository extends JpaRepository<OfficeBulletin, String> {
    List<OfficeBulletin> findByIsActiveTrueOrderByCreatedAtDesc();
    List<OfficeBulletin> findByCreatedByOrderByCreatedAtDesc(User createdBy);
    List<OfficeBulletin> findByCreatedByAndIsActiveTrueOrderByCreatedAtDesc(User createdBy);
}
