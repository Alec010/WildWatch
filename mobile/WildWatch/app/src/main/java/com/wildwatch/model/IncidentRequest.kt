package com.wildwatch.model

import java.time.LocalDate
import java.time.LocalTime
import java.io.File

data class IncidentRequest(
    val incidentType: String,
    val dateOfIncident: String,
    val timeOfIncident: String,
    val location: String,
    val description: String,
    val assignedOffice: String? = null,
    val witnesses: List<WitnessDTO>,
    val additionalNotes: String,  // Include this field
    val evidenceUris: List<String>,  // Include this field
    val evidenceFiles: List<File>? = null,
    val preferAnonymous: Boolean = false
)
