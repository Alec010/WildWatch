package com.teamhyungie.WildWatch.model;

import lombok.Getter;

@Getter
public enum Building {
    NGE_BUILDING(
        "NGE Building", 
        "NGE",
        new LatLngBounds(10.294081000283043, 123.88095539065024, 10.2945683639214, 123.88134229872253),
        "NGE Building - Academic and laboratory facilities"
    ),
    ALLIED_BUILDING(
        "Allied Building", 
        "ALLIED",
        new LatLngBounds(10.294185047561117, 123.87951812193444, 10.295951938122851, 123.8800603712861),
        "Allied Building - Specialized academic programs"
    ),
    RTL_BUILDING(
        "RTL Building", 
        "RTL",
        new LatLngBounds(10.294339078899666, 123.88001623335903, 10.29510912408029, 123.88109659868118),
        "RTL Building - Research and technology laboratory"
    ),
    LINK_BUILDING(
        "Link Building", 
        "LINK",
        new LatLngBounds(10.294850244271194, 123.87991714562595, 10.295135404851644, 123.88012126475257),
        "Link Building - Connecting academic facilities"
    ),
    G_LECROOM(
        "G-Lecroom", 
        "G_LECROOM",
        new LatLngBounds(10.295196122141538, 123.87994990378103, 10.295462037404025, 123.88008266635487),
        "G-Lecroom - General lecture rooms"
    ),
    SAL_BUILDING(
        "SAL Building", 
        "SAL",
        new LatLngBounds(10.295119821085057, 123.87964906812213, 10.296102122674226, 123.88003980662555),
        "SAL Building - Student activities and learning"
    ),
    PE_AREA(
        "P.E Area", 
        "PE_AREA",
        new LatLngBounds(10.295803482776602, 123.87986310427912, 10.296084538322512, 123.8802506834847),
        "Physical Education Area - Sports and fitness facilities"
    ),
    LEARNING_PAD_1_10(
        "Learning Pad 1-10", 
        "LEARNING_PAD",
        new LatLngBounds(10.29663132362959, 123.87988683139704, 10.297185515969145, 123.88003301178946),
        "Learning Pad 1-10 - Modern learning spaces"
    ),
    ACAD_BUILDING(
        "Academic Building", 
        "ACAD",
        new LatLngBounds(10.295501658915517, 123.88081165527367, 10.296015761056077, 123.88169737130187),
        "Academic Building - Main academic departments"
    ),
    GLE_BUILDING(
        "GLE Building", 
        "GLE",
        new LatLngBounds(10.29493803751513, 123.88104095663078, 10.295641337593691, 123.88136148061051),
        "GLE Building - General learning environment"
    ),
    G_PHYSLAB(
        "G-Physlab", 
        "G_PHYSLAB",
        new LatLngBounds(10.295250403475986, 123.88005824958633, 10.295438704259153, 123.88040273740974),
        "G-Physlab - Physics laboratory"
    ),
    MAIN_CANTEEN(
        "Main Canteen", 
        "MAIN_CANTEEN",
        new LatLngBounds(10.295921759006804, 123.88034717750432, 10.296231329156969, 123.88065166459927),
        "Main Canteen - Primary dining facility"
    ),
    HIGHSCHOOL_CANTEEN(
        "Highschool Canteen", 
        "HS_CANTEEN",
        new LatLngBounds(10.29628015023109, 123.87964572946092, 10.296449914351712, 123.87983180490785),
        "Highschool Canteen - Secondary school dining area"
    ),
    MINI_CANTEEN(
        "Mini Canteen", 
        "MINI_CANTEEN",
        new LatLngBounds(10.294180698678195, 123.88006333201143, 10.294248653795432, 123.88024169891227),
        "Mini Canteen - Small dining facility"
    ),
    BACKGATE_PARKING_LOT(
        "Backgate Parking Lot", 
        "BACKGATE_PARKING",
        new LatLngBounds(10.29654944286308, 123.87914266936578, 10.297183385774199, 123.87989543905397),
        "Backgate Parking Lot - Vehicle parking area at back entrance"
    ),
    GYMNASIUM(
        "Gymnasium", 
        "GYM",
        new LatLngBounds(10.296054677041077, 123.87929382078931, 10.296526996755174, 123.87970050780308),
        "Gymnasium - Sports and recreational facilities"
    ),
    ELEMENTARY(
        "Elementary Building", 
        "ELEMENTARY",
        new LatLngBounds(10.296414016688715, 123.8797786554993, 10.296547395929663, 123.88056332220816),
        "Elementary Building - Primary education facilities"
    ),
    LIBRARY(
        "Library", 
        "LIBRARY",
        new LatLngBounds(10.295122535754876, 123.88002956824735, 10.295412832866344, 123.88077835080799),
        "Library - Central library and study areas"
    ),
    ESPACIO(
        "Espacio", 
        "ESPACIO",
        new LatLngBounds(10.29544421632868, 123.8806794700413, 10.295711760160096, 123.88080067871991),
        "Espacio - Modern collaborative learning space"
    ),
    CAMPUS_GROUNDS(
        "Campus Grounds", 
        "GROUNDS",
        new LatLngBounds(10.2940, 123.8790, 10.2975, 123.8820),
        "General campus outdoor areas and walkways"
    );

    private final String fullName;
    private final String code;
    private final LatLngBounds bounds;
    private final String description;

    Building(String fullName, String code, LatLngBounds bounds, String description) {
        this.fullName = fullName;
        this.code = code;
        this.bounds = bounds;
        this.description = description;
    }

    public boolean containsPoint(double latitude, double longitude) {
        return bounds.contains(latitude, longitude);
    }

    public static Building findBuildingByCoordinates(double latitude, double longitude) {
        for (Building building : Building.values()) {
            if (building.containsPoint(latitude, longitude)) {
                return building;
            }
        }
        return CAMPUS_GROUNDS; // Default fallback
    }

    @Getter
    public static class LatLngBounds {
        private final double southWestLat;
        private final double southWestLng;
        private final double northEastLat;
        private final double northEastLng;

        public LatLngBounds(double southWestLat, double southWestLng, double northEastLat, double northEastLng) {
            this.southWestLat = southWestLat;
            this.southWestLng = southWestLng;
            this.northEastLat = northEastLat;
            this.northEastLng = northEastLng;
        }

        public boolean contains(double latitude, double longitude) {
            return latitude >= southWestLat && latitude <= northEastLat &&
                   longitude >= southWestLng && longitude <= northEastLng;
        }

        public double getCenterLat() {
            return (southWestLat + northEastLat) / 2;
        }

        public double getCenterLng() {
            return (southWestLng + northEastLng) / 2;
        }
    }
}
