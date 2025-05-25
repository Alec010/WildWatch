package com.wildwatch.viewmodel

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.LeaderboardEntry
import com.wildwatch.repository.LeaderboardRepository
import com.wildwatch.api.RetrofitClient
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.supervisorScope

class LeaderboardViewModel(private val repository: LeaderboardRepository) : ViewModel() {
    private val _topReporters = MutableStateFlow<List<LeaderboardEntry>>(emptyList())
    val topReporters: StateFlow<List<LeaderboardEntry>> = _topReporters.asStateFlow()

    private val _topOffices = MutableStateFlow<List<LeaderboardEntry>>(emptyList())
    val topOffices: StateFlow<List<LeaderboardEntry>> = _topOffices.asStateFlow()

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private var context: Context? = null

    fun setContext(ctx: Context) {
        context = ctx
    }

    fun fetchLeaderboard() {
        viewModelScope.launch {
            Log.d("LeaderboardViewModel", "Fetching leaderboard data...")
            _loading.value = true
            _error.value = null
            try {
                // Force reinitialization of leaderboardApi to ensure correct base URL and token
                context?.let { com.wildwatch.api.RetrofitClient.resetLeaderboardApi(it) }
                supervisorScope {
                    val reportersDeferred = async { repository.getTopReporters() }
                    val officesDeferred = async { repository.getTopOffices() }
                    val reporters = reportersDeferred.await()
                    Log.d("LeaderboardViewModel", "Fetched top reporters: ${reporters.size}")
                    val offices = officesDeferred.await()
                    Log.d("LeaderboardViewModel", "Fetched top offices: ${offices.size}")
                    _topReporters.value = reporters
                    _topOffices.value = offices
                }
            } catch (e: Exception) {
                Log.e("LeaderboardViewModel", "Error fetching leaderboard: ${e.message}", e)
                _error.value = e.message ?: "Failed to load leaderboard."
            } finally {
                _loading.value = false
            }
        }
    }

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            val repository = LeaderboardRepository(context)
            return LeaderboardViewModel(repository) as T
        }
    }
} 