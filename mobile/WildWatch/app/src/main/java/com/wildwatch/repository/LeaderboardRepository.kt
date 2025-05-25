package com.wildwatch.repository

import android.content.Context
import com.wildwatch.api.RetrofitClient
import com.wildwatch.model.LeaderboardEntry

class LeaderboardRepository(private val context: Context) {
    private val api get() = com.wildwatch.api.RetrofitClient.getLeaderboardApi(context)

    suspend fun getTopReporters(): List<LeaderboardEntry> {
        return api.getTopReporters()
    }

    suspend fun getTopOffices(): List<LeaderboardEntry> {
        return api.getTopOffices()
    }
} 