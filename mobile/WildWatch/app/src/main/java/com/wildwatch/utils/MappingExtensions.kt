package com.wildwatch.utils

import com.wildwatch.model.IncidentResponse
import com.wildwatch.ui.components.dashboard.IncidentInfo
import com.wildwatch.ui.components.dashboard.IncidentStatus

fun IncidentResponse.toIncidentInfo(): IncidentInfo {
    return IncidentInfo(
        title = incidentType,
        location = location,
        locationDetail = assignedOffice,  // Adjust this if assignedOffice can be null
        description = description,
        status = when (status) {
            "Pending" -> IncidentStatus.ASSIGNED
            "In Progress" -> IncidentStatus.IN_PROGRESS
            "Resolved" -> IncidentStatus.RESOLVED
            "Urgent" -> IncidentStatus.URGENT
            else -> IncidentStatus.IN_PROGRESS
        },
        timestamp = submittedAt ?: "Unknown Date"
    )
}
