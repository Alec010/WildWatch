package com.wildwatch.model

import android.net.Uri

data class IncidentFormState(
    val incidentType: String = "",
    val dateOfIncident: String = "",
    val timeOfIncident: String = "",
    val location: String = "",
    val assignedOffice: String = "",
    val description: String = "",
    val witnesses: List<WitnessDTO> = emptyList(),
    val evidenceUris: List<String> = emptyList(),
    val additionalNotes: String = ""
)
