package com.wildwatch.api

import com.wildwatch.model.ActivitiesResponse
import com.wildwatch.model.IncidentResponse
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.POST

interface CaseApi {
    @GET("/api/incidents/my-incidents")
    suspend fun getUserIncidents(): List<IncidentResponse>

    @GET("/api/incidents/public")
    suspend fun getPublicIncidents(): List<IncidentResponse>

    @GET("/api/incidents/{id}")
    suspend fun getIncidentById(@Path("id") id: String): IncidentResponse

    @GET("activity-logs")
    suspend fun getUserActivities(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): ActivitiesResponse

    @GET("/api/incidents/{id}/upvote-status")
    suspend fun getUpvoteStatus(@Path("id") incidentId: String): Boolean

    @POST("/api/incidents/{id}/upvote")
    suspend fun toggleUpvote(@Path("id") incidentId: String): Boolean
}
