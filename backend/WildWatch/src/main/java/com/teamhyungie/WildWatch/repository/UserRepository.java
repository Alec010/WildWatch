package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsBySchoolIdNumber(String schoolIdNumber);
} 