package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.Office;
import lombok.Data;

@Data
public class IncidentTransferRequest {
    private Office newOffice;
    private String transferNotes;
} 