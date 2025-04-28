package com.wildwatch.model

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

data class IncidentResponse(
    val id: String,
    val trackingNumber: String,
    val incidentType: String,
    val dateOfIncident: String,
    val timeOfIncident: String,
    val location: String,
    val description: String,
    val assignedOffice: String,
    val priorityLevel: String?,
    val status: String,
    val submittedBy: String,
    val submittedAt: String
)
