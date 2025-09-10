package com.wildwatch.api

import com.wildwatch.model.ActivitiesResponse
import com.wildwatch.model.IncidentResponse
import com.wildwatch.model.RatingRequest
import com.wildwatch.model.IncidentRatingResponse
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.POST
import retrofit2.http.Body

interface CaseApi {
    @GET("/api/incidents/my-incidents")
    suspend fun getUserIncidents(): List<IncidentResponse>

    @GET("/api/incidents/public")
    suspend fun getPublicIncidents(): List<IncidentResponse>

    @GET("/api/incidents/{id}")
    suspend fun getIncidentById(@Path("id") id: String): IncidentResponse

    @GET("/api/incidents/track/{trackingNumber}")
    suspend fun getIncidentByTrackingNumber(@Path("trackingNumber") trackingNumber: String): IncidentResponse

    @GET("activity-logs")
    suspend fun getUserActivities(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): ActivitiesResponse

    @GET("/api/incidents/{id}/upvote-status")
    suspend fun getUpvoteStatus(@Path("id") incidentId: String): Boolean

    @POST("/api/incidents/{id}/upvote")
    suspend fun toggleUpvote(@Path("id") incidentId: String): Boolean

    @POST("/api/incidents/{id}/rate")
    suspend fun submitRating(
        @Path("id") incidentId: String,
        @Body request: RatingRequest
    ): IncidentResponse

    @GET("/api/ratings/incidents/{trackingNumber}")
    suspend fun getIncidentRatingStatus(@Path("trackingNumber") trackingNumber: String): IncidentRatingResponse

    @POST("/api/ratings/incidents/{trackingNumber}/reporter")
    suspend fun submitReporterRating(
        @Path("trackingNumber") trackingNumber: String,
        @Body request: RatingRequest
    ): IncidentRatingResponse
}
