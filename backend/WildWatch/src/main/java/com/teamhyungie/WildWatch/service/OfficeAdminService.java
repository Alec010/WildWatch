package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.model.OfficeAdmin;
import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.repository.OfficeAdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OfficeAdminService {

    @Autowired
    private OfficeAdminRepository officeAdminRepository;

    @Autowired
    private UserService userService;

    public OfficeAdmin createOfficeAdmin(User user, String officeName, String officeCode, String officeDescription) {
        if (officeAdminRepository.existsByOfficeCode(officeCode)) {
            throw new RuntimeException("Office code already exists");
        }

        OfficeAdmin officeAdmin = new OfficeAdmin();
        officeAdmin.setUser(user);
        officeAdmin.setOfficeName(officeName);
        officeAdmin.setOfficeCode(officeCode);
        officeAdmin.setOfficeDescription(officeDescription);
        officeAdmin.setActive(true);

        return officeAdminRepository.save(officeAdmin);
    }

    public Optional<OfficeAdmin> findByOfficeCode(String officeCode) {
        return officeAdminRepository.findByOfficeCode(officeCode);
    }

    public Optional<OfficeAdmin> findByUserEmail(String email) {
        return officeAdminRepository.findByUser_Email(email);
    }

    public List<OfficeAdmin> findAllActive() {
        return officeAdminRepository.findAll();
    }

    public OfficeAdmin updateOfficeAdmin(Long id, String officeName, String officeDescription) {
        OfficeAdmin officeAdmin = officeAdminRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Office admin not found"));

        officeAdmin.setOfficeName(officeName);
        officeAdmin.setOfficeDescription(officeDescription);

        return officeAdminRepository.save(officeAdmin);
    }

    public void deactivateOfficeAdmin(Long id) {
        OfficeAdmin officeAdmin = officeAdminRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Office admin not found"));

        officeAdmin.setActive(false);
        officeAdminRepository.save(officeAdmin);
    }

    public OfficeAdmin save(OfficeAdmin officeAdmin) {
        return officeAdminRepository.save(officeAdmin);
    }
} 