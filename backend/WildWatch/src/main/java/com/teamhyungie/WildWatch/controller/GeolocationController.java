package com.teamhyungie.WildWatch.controller;

import com.teamhyungie.WildWatch.dto.BuildingResponse;
import com.teamhyungie.WildWatch.dto.GeolocationRequest;
import com.teamhyungie.WildWatch.dto.GeolocationResponse;
import com.teamhyungie.WildWatch.service.BuildingService;
import com.teamhyungie.WildWatch.service.GeolocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geolocation")
@RequiredArgsConstructor
public class GeolocationController {

    private final GeolocationService geolocationService;
    private final BuildingService buildingService;

    @PostMapping("/reverse-geocode")
    public ResponseEntity<GeolocationResponse> reverseGeocode(@Valid @RequestBody GeolocationRequest request) {
        GeolocationResponse response = geolocationService.reverseGeocode(request.getLatitude(), request.getLongitude());
        
        if ("ERROR".equals(response.getStatus())) {
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate-location")
    public ResponseEntity<Map<String, Object>> validateLocation(@Valid @RequestBody GeolocationRequest request) {
        Boolean isValid = geolocationService.validateLocation(request.getLatitude(), request.getLongitude());
        
        return ResponseEntity.ok(Map.of(
            "valid", isValid,
            "latitude", request.getLatitude(),
            "longitude", request.getLongitude(),
            "message", isValid ? "Location is within campus bounds" : "Location is outside campus bounds"
        ));
    }

    @GetMapping("/buildings")
    public ResponseEntity<List<BuildingResponse>> getAllBuildings() {
        List<BuildingResponse> buildings = buildingService.getAllBuildings();
        return ResponseEntity.ok(buildings);
    }

    @GetMapping("/buildings/{code}")
    public ResponseEntity<BuildingResponse> getBuildingByCode(@PathVariable String code) {
        return buildingService.getBuildingByCode(code)
                .map(building -> ResponseEntity.ok(building))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buildings/within-bounds")
    public ResponseEntity<List<BuildingResponse>> getBuildingsWithinBounds(
            @RequestParam Double swLat,
            @RequestParam Double swLng,
            @RequestParam Double neLat,
            @RequestParam Double neLng) {
        
        List<BuildingResponse> buildings = buildingService.getBuildingsWithinBounds(swLat, swLng, neLat, neLng);
        return ResponseEntity.ok(buildings);
    }

    @GetMapping("/campus-info")
    public ResponseEntity<Map<String, Object>> getCampusInfo() {
        return ResponseEntity.ok(Map.of(
            "centerLatitude", geolocationService.getCampusCenterLatitude(),
            "centerLongitude", geolocationService.getCampusCenterLongitude(),
            "maxDistanceMeters", geolocationService.getMaxDistanceFromCampus(),
            "totalBuildings", buildingService.getAllBuildings().size()
        ));
    }
}
