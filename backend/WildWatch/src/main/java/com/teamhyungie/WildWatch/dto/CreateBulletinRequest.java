package com.teamhyungie.WildWatch.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateBulletinRequest {
    private String title;
    private String description;
    private List<String> selectedIncidents;
}
