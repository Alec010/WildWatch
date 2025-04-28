package com.wildwatch.api

import com.wildwatch.model.ActivitiesResponse
import com.wildwatch.model.IncidentResponse
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface CaseApi {
    @GET("incidents/my-incidents") // No need for "/api/" because your BASE_URL already has it
    suspend fun getUserIncidents(): List<IncidentResponse>

    @GET("incidents/{id}")
    suspend fun getIncidentById(@Path("id") id: String): IncidentResponse

    @GET("activities/my-activities")
    suspend fun getUserActivities(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): ActivitiesResponse

}
