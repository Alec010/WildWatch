package com.wildwatch.api

import com.wildwatch.model.LeaderboardEntry
import retrofit2.http.GET

interface LeaderboardApiService {
    @GET("ratings/leaderboard/reporters/top")
    suspend fun getTopReporters(): List<LeaderboardEntry>

    @GET("ratings/leaderboard/offices/top")
    suspend fun getTopOffices(): List<LeaderboardEntry>
} 