package com.wildwatch.repository

import com.wildwatch.api.IncidentApi
import com.wildwatch.model.IncidentResponse
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class HistoryRepository(
    private val incidentApi: IncidentApi
) {
    // One-time fetch
    suspend fun getIncidentHistory(): List<IncidentResponse> {
        val response = incidentApi.getUserIncidents()
        if (!response.isSuccessful) {
            throw Exception("Failed to fetch incidents: ${response.message()}")
        }
        
        return response.body()?.filter { incident ->
            incident.status.equals("resolved", ignoreCase = true) || 
            incident.status.equals("dismissed", ignoreCase = true)
        } ?: emptyList()
    }

    // Real-time updates with polling
    fun getIncidentHistoryFlow(pollingInterval: Long = 5000L): Flow<List<IncidentResponse>> = flow {
        while (true) {
            try {
                val response = incidentApi.getUserIncidents()
                if (response.isSuccessful) {
                    val incidents = response.body()?.filter { incident ->
                        incident.status.equals("resolved", ignoreCase = true) || 
                        incident.status.equals("dismissed", ignoreCase = true)
                    } ?: emptyList()
                    emit(incidents)
                }
            } catch (e: Exception) {
                // Log error but don't stop the flow
                e.printStackTrace()
            }
            delay(pollingInterval) // Wait before next poll
        }
    }
} 