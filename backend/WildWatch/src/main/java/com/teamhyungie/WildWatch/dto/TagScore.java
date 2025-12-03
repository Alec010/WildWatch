package com.teamhyungie.WildWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TagScore {

    private String tag;
    private Double score;
    private String reason; // Brief explanation of why this tag scored highly
}
