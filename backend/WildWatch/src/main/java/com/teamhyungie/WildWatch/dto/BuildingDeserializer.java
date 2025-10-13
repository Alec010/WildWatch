package com.teamhyungie.WildWatch.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.teamhyungie.WildWatch.model.Building;

import java.io.IOException;

public class BuildingDeserializer extends JsonDeserializer<Building> {
    @Override
    public Building deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Building.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            // If the building name is not found, return null or a default
            return null;
        }
    }
}













