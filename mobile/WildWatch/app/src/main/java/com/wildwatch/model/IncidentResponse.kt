package com.wildwatch.model

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
    val submittedAt: String,
    val submittedByFullName: String? = null,
    val submittedByEmail: String? = null,
    val submittedByPhone: String? = null,
    val officeAdminName: String? = null,
    val finishedDate: String? = null,
    val verified: Boolean? = null,
    val evidence: List<EvidenceDTO>? = null,
    val witnesses: List<WitnessDTO>? = null
)

data class EvidenceDTO(
    val id: String,
    val fileUrl: String,
    val fileName: String,
    val fileType: String,
    val fileSize: Long,
    val uploadedAt: String
)
