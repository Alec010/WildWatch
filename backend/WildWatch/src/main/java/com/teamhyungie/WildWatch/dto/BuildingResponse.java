package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.Building;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuildingResponse {
    private String code;
    private String name;
    private String description;
    private Double centerLatitude;
    private Double centerLongitude;
    private BoundsResponse bounds;

    public BuildingResponse(Building building) {
        this.code = building.getCode();
        this.name = building.getFullName();
        this.description = building.getDescription();
        this.centerLatitude = building.getBounds().getCenterLat();
        this.centerLongitude = building.getBounds().getCenterLng();
        this.bounds = new BoundsResponse(building.getBounds());
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoundsResponse {
        private Double southWestLat;
        private Double southWestLng;
        private Double northEastLat;
        private Double northEastLng;

        public BoundsResponse(Building.LatLngBounds bounds) {
            this.southWestLat = bounds.getSouthWestLat();
            this.southWestLng = bounds.getSouthWestLng();
            this.northEastLat = bounds.getNorthEastLat();
            this.northEastLng = bounds.getNorthEastLng();
        }
    }
}













