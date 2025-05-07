package com.wildwatch.network

import com.wildwatch.model.ActivityLogResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ActivityLogService {
    @GET("activity-logs")
    suspend fun getActivityLogs(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 10
    ): Response<ActivityLogResponse>

    @PUT("activity-logs/{id}/read")
    suspend fun markAsRead(@Path("id") id: String): Response<Unit>

    @PUT("activity-logs/read-all")
    suspend fun markAllAsRead(): Response<Unit>
}