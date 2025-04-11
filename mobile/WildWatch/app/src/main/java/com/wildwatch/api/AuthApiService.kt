package com.wildwatch.api

import com.wildwatch.model.LoginRequest
import com.wildwatch.model.LoginResponse
import com.wildwatch.model.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<Unit>
}
