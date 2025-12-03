package com.teamhyungie.WildWatch.dto;

import lombok.Data;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

@Data
public class BulkIncidentUpdateRequest {
	@NotEmpty
	private List<String> incidentIds;
	@NotBlank
	private String updateMessage;
	private Boolean visibleToReporter;
}
