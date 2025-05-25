package com.wildwatch.network

import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("chatbot")
    suspend fun chat(@Body message: ChatRequest): ChatResponse
}

data class ChatRequest(
    val message: String
)

data class ChatResponse(
    val reply: String
) 