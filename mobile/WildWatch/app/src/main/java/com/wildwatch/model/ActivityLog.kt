package com.wildwatch.model

import java.util.Date

data class ActivityLog(
    val id: String,
    val activityType: String,
    val description: String,
    val createdAt: Date,
    val isRead: Boolean,
    val incident: IncidentInfo?
)

data class IncidentInfo(
    val id: String,
    val trackingNumber: String
)

data class ActivityLogResponse(
    val content: List<ActivityLog>,
    val totalElements: Long,
    val totalPages: Int,
    val size: Int,
    val number: Int
) 