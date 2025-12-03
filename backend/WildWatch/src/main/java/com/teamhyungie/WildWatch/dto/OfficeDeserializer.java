package com.teamhyungie.WildWatch.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.teamhyungie.WildWatch.model.Office;

import java.io.IOException;

public class OfficeDeserializer extends StdDeserializer<Office> {
    
    public OfficeDeserializer() {
        super(Office.class);
    }

    @Override
    public Office deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Office.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
} 