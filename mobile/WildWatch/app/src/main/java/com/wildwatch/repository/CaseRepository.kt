package com.wildwatch.repository

import android.content.Context
import com.wildwatch.api.RetrofitClient
import com.wildwatch.model.IncidentResponse
import com.wildwatch.api.CaseApi
import com.wildwatch.model.ActivitiesResponse

class CaseRepository(private val context: Context) {
    private val api = RetrofitClient.getCaseApi(context) // ✅ Uses your secured Retrofit with token

    suspend fun getUserIncidents(): List<IncidentResponse> {
        return api.getUserIncidents()
    }

    suspend fun getPublicIncidents(): List<IncidentResponse> {
        return api.getPublicIncidents()
    }

    suspend fun getIncidentById(id: String): IncidentResponse {
        return api.getIncidentById(id)
    }

    suspend fun getUserActivities(page: Int, size: Int): ActivitiesResponse {
        return api.getUserActivities(page, size)  // This assumes you have this defined in your Retrofit API interface
    }

    suspend fun getUpvoteStatus(incidentId: String): Boolean {
        return api.getUpvoteStatus(incidentId)
    }

    suspend fun toggleUpvote(incidentId: String): Boolean {
        return api.toggleUpvote(incidentId)
    }
}
