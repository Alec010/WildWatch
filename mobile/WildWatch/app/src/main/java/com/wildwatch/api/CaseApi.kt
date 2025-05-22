package com.wildwatch.api

import com.wildwatch.model.ActivitiesResponse
import com.wildwatch.model.IncidentResponse
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface CaseApi {
    @GET("/api/incidents/my-incidents")
    suspend fun getUserIncidents(): List<IncidentResponse>

    @GET("/api/incidents/{id}")
    suspend fun getIncidentById(@Path("id") id: String): IncidentResponse

    @GET("activity-logs")
    suspend fun getUserActivities(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): ActivitiesResponse

}
