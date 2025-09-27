package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.Building;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeolocationResponse {
    private Double latitude;
    private Double longitude;
    private String formattedAddress;
    private Building building;
    private String buildingName;
    private String buildingCode;
    private Boolean withinCampus;
    private Double distanceFromCampusCenter;
    private String status;
    private String message;

    // Constructor for successful response
    public GeolocationResponse(Double latitude, Double longitude, String formattedAddress, 
                              Building building, Boolean withinCampus, Double distanceFromCampusCenter) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.formattedAddress = formattedAddress;
        this.building = building;
        this.buildingName = building != null ? building.getFullName() : null;
        this.buildingCode = building != null ? building.getCode() : null;
        this.withinCampus = withinCampus;
        this.distanceFromCampusCenter = distanceFromCampusCenter;
        this.status = "SUCCESS";
        this.message = "Location processed successfully";
    }

    // Constructor for error response
    public GeolocationResponse(String status, String message) {
        this.status = status;
        this.message = message;
        this.withinCampus = false;
    }
}





