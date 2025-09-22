package com.teamhyungie.WildWatch.service;

import com.teamhyungie.WildWatch.dto.GeolocationResponse;
import com.teamhyungie.WildWatch.model.Building;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeolocationService {

    @Value("${google.maps.api.key}")
    private String apiKey;

    @Value("${campus.center.latitude}")
    private Double campusCenterLat;

    @Value("${campus.center.longitude}")
    private Double campusCenterLng;

    @Value("${campus.max.distance.meters}")
    private Double maxDistanceFromCampus;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeolocationResponse reverseGeocode(Double latitude, Double longitude) {
        try {
            // Validate coordinates
            if (latitude == null || longitude == null) {
                return new GeolocationResponse("ERROR", "Latitude and longitude are required");
            }

            // Check if coordinates are valid ranges
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return new GeolocationResponse("ERROR", "Invalid coordinate values");
            }

            // Check if location is within actual campus boundary
            Boolean withinCampus = isWithinCampusBounds(latitude, longitude);
            Double distanceFromCenter = calculateDistance(latitude, longitude, campusCenterLat, campusCenterLng);

            // Find building based on coordinates - only if within campus bounds
            Building building = null;
            if (withinCampus) {
                building = Building.findBuildingByCoordinates(latitude, longitude);
            }

            // Get formatted address from Google Maps
            String formattedAddress = getFormattedAddress(latitude, longitude);

            return new GeolocationResponse(
                latitude, 
                longitude, 
                formattedAddress, 
                building, 
                withinCampus, 
                distanceFromCenter
            );

        } catch (Exception e) {
            log.error("Error in reverse geocoding: ", e);
            return new GeolocationResponse("ERROR", "Failed to process location: " + e.getMessage());
        }
    }

    private String getFormattedAddress(Double latitude, Double longitude) {
        try {
            // Use Google Maps Geocoding REST API instead of the Java library
            String url = String.format(
                "https://maps.googleapis.com/maps/api/geocode/json?latlng=%f,%f&key=%s",
                latitude, longitude, apiKey
            );
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            
            if ("OK".equals(jsonResponse.get("status").asText())) {
                JsonNode results = jsonResponse.get("results");
                if (results.isArray() && results.size() > 0) {
                    return results.get(0).get("formatted_address").asText();
                }
            }
            
            return String.format("%.6f, %.6f", latitude, longitude);
        } catch (Exception e) {
            log.error("Error getting formatted address: ", e);
            return String.format("%.6f, %.6f", latitude, longitude);
        }
    }

    public Boolean validateLocation(Double latitude, Double longitude) {
        try {
            return isWithinCampusBounds(latitude, longitude);
        } catch (Exception e) {
            log.error("Error validating location: ", e);
            return false;
        }
    }

    /**
     * Check if coordinates are within the actual campus polygon boundary
     */
    private Boolean isWithinCampusBounds(Double latitude, Double longitude) {
        // Define the actual campus boundary polygon coordinates
        double[][] campusPolygon = {
            {10.297153610508257, 123.87918444217755},
            {10.296456911339208, 123.87927563728236},
            {10.294170119974705, 123.87994394768552},
            {10.294352090572659, 123.88092281728376},
            {10.294005902515728, 123.88106265579779},
            {10.294409788545215, 123.88163103169356},
            {10.29469827824969, 123.88147766042012},
            {10.295665826408769, 123.8817528265405},
            {10.296078586876392, 123.88089575177703},
            {10.296504661645105, 123.88083259889503},
            {10.296642248161724, 123.88048525806984},
            {10.297476642525188, 123.88037699599445},
            {10.29752546340363, 123.88003416608909},
            {10.29725472934614, 123.87993943677313}
        };

        return isPointInPolygon(latitude, longitude, campusPolygon);
    }

    /**
     * Ray casting algorithm to determine if a point is inside a polygon
     */
    private Boolean isPointInPolygon(Double lat, Double lng, double[][] polygon) {
        int i, j;
        boolean inside = false;
        
        for (i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i][0] > lat) != (polygon[j][0] > lat)) &&
                (lng < (polygon[j][1] - polygon[i][1]) * (lat - polygon[i][0]) / (polygon[j][0] - polygon[i][0]) + polygon[i][1])) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in meters
     */
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

    public Double getCampusCenterLatitude() {
        return campusCenterLat;
    }

    public Double getCampusCenterLongitude() {
        return campusCenterLng;
    }

    public Double getMaxDistanceFromCampus() {
        return maxDistanceFromCampus;
    }
}
