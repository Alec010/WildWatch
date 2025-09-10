package com.wildwatch.model

import android.net.Uri
import java.io.File

data class IncidentFormState(
    val incidentType: String = "",
    val dateOfIncident: String = "",
    val timeOfIncident: String = "",
    val location: String = "",
    val assignedOffice: String? = null,
    val description: String = "",
    val witnesses: List<WitnessDTO> = emptyList(),
    val evidenceUris: List<String> = emptyList(),
    val evidenceFiles: List<File> = emptyList(),
    val additionalNotes: String = "",
    val tags: List<String> = emptyList(),
    val preferAnonymous: Boolean = false
)
