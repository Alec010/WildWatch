package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.wildwatch.BuildConfig
import com.wildwatch.model.ActivityLog
import com.wildwatch.network.ActivityLogService
import com.wildwatch.network.WebSocketService
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import java.util.*
import android.util.Log
import com.wildwatch.api.RetrofitClient
import retrofit2.converter.gson.GsonConverterFactory

class NotificationViewModel(
    private val context: Context,
    private val activityLogService: ActivityLogService,
    private val webSocketService: WebSocketService
) : ViewModel() {
    
    private val _notifications = MutableStateFlow<List<ActivityLog>>(emptyList())
    val notifications: StateFlow<List<ActivityLog>> = _notifications.asStateFlow()

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        Log.d("NotificationViewModel", "API_BASE_URL: ${BuildConfig.API_BASE_URL}")
        setupWebSocket()
        fetchNotifications()
    }

    private fun setupWebSocket() {
        viewModelScope.launch {
            webSocketService.notificationFlow.collect { activityLog ->
                val currentList = _notifications.value.toMutableList()
                val existingIndex = currentList.indexOfFirst { it.id == activityLog.id }
                
                if (existingIndex != -1) {
                    currentList[existingIndex] = activityLog
                } else {
                    currentList.add(0, activityLog)
                }
                
                _notifications.value = currentList
                updateUnreadCount()
            }
        }
    }

    fun fetchNotifications() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = activityLogService.getActivityLogs()
                if (response.isSuccessful) {
                    response.body()?.let { activityLogResponse ->
                        _notifications.value = activityLogResponse.content
                        updateUnreadCount()
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    val message = "Failed to fetch notifications: ${response.code()} ${response.message()}\n${errorBody ?: "No error body"}"
                    Log.e("NotificationViewModel", message)
                    _error.value = message
                }
            } catch (e: Exception) {
                Log.e("NotificationViewModel", "Exception fetching notifications", e)
                _error.value = "Exception: ${e.localizedMessage ?: e.toString()}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun markAsRead(id: String) {
        viewModelScope.launch {
            try {
                val response = activityLogService.markAsRead(id)
                if (response.isSuccessful) {
                    val currentList = _notifications.value.toMutableList()
                    val index = currentList.indexOfFirst { it.id == id }
                    if (index != -1) {
                        currentList[index] = currentList[index].copy(isRead = true)
                        _notifications.value = currentList
                        updateUnreadCount()
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    val message = "Failed to mark as read: ${response.code()} ${response.message()}\n${errorBody ?: "No error body"}"
                    Log.e("NotificationViewModel", message)
                    _error.value = message
                }
            } catch (e: Exception) {
                Log.e("NotificationViewModel", "Exception marking as read", e)
                _error.value = "Exception: ${e.localizedMessage ?: e.toString()}"
            }
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            try {
                Log.d("NotificationViewModel", "API_BASE_URL: ${BuildConfig.API_BASE_URL}")
                val response = activityLogService.markAllAsRead()
                if (response.isSuccessful) {
                    _notifications.value = _notifications.value.map { it.copy(isRead = true) }
                    updateUnreadCount()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val message = "Failed to mark all as read: ${response.code()} ${response.message()}\n${errorBody ?: "No error body"}"
                    Log.e("NotificationViewModel", message)
                    _error.value = message
                }
            } catch (e: Exception) {
                Log.e("NotificationViewModel", "Exception marking all as read", e)
                _error.value = "Exception: ${e.localizedMessage ?: e.toString()}\nStackTrace: ${Log.getStackTraceString(e)}"
            }
        }
    }

    private fun updateUnreadCount() {
        _unreadCount.value = _notifications.value.count { !it.isRead }
    }

    override fun onCleared() {
        super.onCleared()
        webSocketService.disconnect()
    }

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            val activityLogService = RetrofitClient.getActivityLogApi(context)
            val webSocketService = WebSocketService()
            return NotificationViewModel(context, activityLogService, webSocketService) as T
        }
    }
} 