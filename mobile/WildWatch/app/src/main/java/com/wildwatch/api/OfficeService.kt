package com.wildwatch.api

import com.wildwatch.model.OfficeResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface OfficeService {
    @GET("offices")  // Endpoint to fetch office data
    suspend fun getOffices(@Header("Authorization") token: String): Response<List<OfficeResponse>> // Return Response instead of List
}