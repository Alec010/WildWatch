package com.wildwatch.model

data class LeaderboardEntry(
    val id: Long,
    val name: String,
    val totalIncidents: Int?,
    val averageRating: Double?,
    val points: Int?,
    val activeIncidents: Int? = null,
    val resolvedIncidents: Int? = null
) 