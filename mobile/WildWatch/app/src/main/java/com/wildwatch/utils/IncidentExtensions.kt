package com.wildwatch.utils

import com.wildwatch.model.IncidentResponse
import com.wildwatch.ui.components.dashboard.IncidentInfo
import com.wildwatch.ui.components.dashboard.IncidentStatus

fun IncidentResponse.toIncidentInfo(): IncidentInfo {
    val status = when (this.status.lowercase()) {
        "in progress" -> IncidentStatus.IN_PROGRESS
        "assigned" -> IncidentStatus.ASSIGNED
        "resolved" -> IncidentStatus.RESOLVED
        "urgent" -> IncidentStatus.URGENT
        "pending" -> IncidentStatus.PENDING
        else -> IncidentStatus.IN_PROGRESS
    }

    return IncidentInfo(
        id = this.trackingNumber,
        title = this.incidentType,
        location = this.location,
        locationDetail = this.assignedOffice ?: "",
        description = this.description ?: "",
        status = status,
        timestamp = formatDate(this.dateOfIncident)
    )
}

private fun formatDate(dateString: String): String {
    return try {
        // Try to parse and format the date
        // This is a simplified version - you might want to implement proper date formatting
        if (dateString.contains("T")) {
            val parts = dateString.split("T")
            val datePart = parts[0].split("-")
            val year = datePart[0]
            val month = datePart[1]
            val day = datePart[2]
            "$month/$day/$year"
        } else {
            dateString
        }
    } catch (e: Exception) {
        dateString
    }
}
