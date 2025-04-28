package com.wildwatch.model

import java.time.LocalDate
import java.time.LocalTime

data class IncidentRequest(
    val incidentType: String,
    val dateOfIncident: String,
    val timeOfIncident: String,
    val location: String,
    val description: String,
    val assignedOffice: String,
    val witnesses: List<WitnessDTO> = emptyList()
)
