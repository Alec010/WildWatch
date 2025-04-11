package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.model.Office;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/offices")
public class OfficeController {

    @GetMapping
    public ResponseEntity<List<OfficeInfo>> getAllOffices() {
        List<OfficeInfo> offices = Arrays.stream(Office.values())
            .map(office -> new OfficeInfo(
                office.name(),
                office.getFullName(),
                office.getDescription()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(offices);
    }

    public static class OfficeInfo {
        private final String code;
        private final String fullName;
        private final String description;

        public OfficeInfo(String code, String fullName, String description) {
            this.code = code;
            this.fullName = fullName;
            this.description = description;
        }

        public String getCode() {
            return code;
        }

        public String getFullName() {
            return fullName;
        }

        public String getDescription() {
            return description;
        }
    }
} 