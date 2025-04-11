package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.OfficeAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OfficeAdminRepository extends JpaRepository<OfficeAdmin, Long> {
    Optional<OfficeAdmin> findByOfficeCode(String officeCode);
    Optional<OfficeAdmin> findByUser_Email(String email);
    boolean existsByOfficeCode(String officeCode);
} 