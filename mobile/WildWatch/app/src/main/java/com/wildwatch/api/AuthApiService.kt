package com.wildwatch.api

import com.wildwatch.model.LoginRequest
import com.wildwatch.model.LoginResponse
import com.wildwatch.model.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import com.wildwatch.model.UserProfile
import retrofit2.http.GET
import com.wildwatch.model.UserUpdateRequest
import retrofit2.http.PUT
import retrofit2.http.Header

interface AuthApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<Unit>

    @GET("auth/profile")
    suspend fun getProfile(
        @Header("Authorization") token: String
    ): Response<UserProfile>

    @PUT("users/me")
    suspend fun updateUser(
        @Header("Authorization") token: String,
        @Body request: UserUpdateRequest
    ): Response<UserProfile>

}
