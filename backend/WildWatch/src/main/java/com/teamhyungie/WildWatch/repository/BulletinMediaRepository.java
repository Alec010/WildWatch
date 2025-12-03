package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.BulletinMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulletinMediaRepository extends JpaRepository<BulletinMedia, String> {
    List<BulletinMedia> findByBulletinId(String bulletinId);
}
