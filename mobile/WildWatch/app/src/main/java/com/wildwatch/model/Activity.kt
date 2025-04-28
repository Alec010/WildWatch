package com.wildwatch.model

data class ActivitiesResponse(
    val content: List<Activity>,
    val totalPages: Int,
    val totalElements: Int
)

data class Activity(
    val id: String,
    val activityType: String,
    val description: String,
    val createdAt: String,
    val incident: IncidentRef
)

data class IncidentRef(
    val id: String,
    val trackingNumber: String
)
