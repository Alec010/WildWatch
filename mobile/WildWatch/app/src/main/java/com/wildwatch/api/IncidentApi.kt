package com.wildwatch.api

import com.wildwatch.model.IncidentResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface IncidentApi {
    @Multipart
    @POST("/api/incidents")
    suspend fun createIncident(
        @Part("incidentData") incidentData: RequestBody,
        @Part files: List<MultipartBody.Part>? = null
    ): Response<IncidentResponse>

    @GET("/api/incidents/my-incidents")
    suspend fun getUserIncidents(): Response<List<IncidentResponse>>
}
