package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.BuildingResponse;
import com.teamhyungie.WildWatch.model.Building;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BuildingService {

    public List<BuildingResponse> getAllBuildings() {
        return Arrays.stream(Building.values())
                .map(BuildingResponse::new)
                .collect(Collectors.toList());
    }

    public Optional<BuildingResponse> getBuildingByCode(String code) {
        try {
            Building building = Building.valueOf(code.toUpperCase());
            return Optional.of(new BuildingResponse(building));
        } catch (IllegalArgumentException e) {
            log.warn("Building not found with code: {}", code);
            return Optional.empty();
        }
    }

    public Optional<Building> findBuildingByCoordinates(Double latitude, Double longitude) {
        Building building = Building.findBuildingByCoordinates(latitude, longitude);
        return building != null ? Optional.of(building) : Optional.empty();
    }

    public List<BuildingResponse> getBuildingsWithinBounds(Double swLat, Double swLng, Double neLat, Double neLng) {
        return Arrays.stream(Building.values())
                .filter(building -> {
                    Building.LatLngBounds bounds = building.getBounds();
                    // Check if building bounds intersect with given bounds
                    return bounds.getSouthWestLat() <= neLat && bounds.getNorthEastLat() >= swLat &&
                           bounds.getSouthWestLng() <= neLng && bounds.getNorthEastLng() >= swLng;
                })
                .map(BuildingResponse::new)
                .collect(Collectors.toList());
    }

    public Double calculateDistanceBetweenBuildings(Building building1, Building building2) {
        double lat1 = building1.getBounds().getCenterLat();
        double lng1 = building1.getBounds().getCenterLng();
        double lat2 = building2.getBounds().getCenterLat();
        double lng2 = building2.getBounds().getCenterLng();

        return calculateDistance(lat1, lng1, lat2, lng2);
    }

    private Double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c * 1000; // convert to meters

        return distance;
    }
}









