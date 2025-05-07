package com.wildwatch.network

import android.util.Log
import com.wildwatch.BuildConfig
import com.wildwatch.model.ActivityLog
import com.wildwatch.model.IncidentInfo
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import okhttp3.*
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

class WebSocketService {
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private val _notificationFlow = MutableSharedFlow<ActivityLog>()
    val notificationFlow: SharedFlow<ActivityLog> = _notificationFlow

    fun connect(token: String) {
        Log.d("WebSocketService", "Connecting to: ${BuildConfig.WS_BASE_URL}/ws/notifications")
        val request = Request.Builder()
            .url("${BuildConfig.WS_BASE_URL}/ws/notifications")
            .addHeader("Authorization", "Bearer $token")
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSS", Locale.US).apply {
                        timeZone = TimeZone.getTimeZone("UTC")
                    }
                    val createdAt = dateFormat.parse(json.getString("createdAt"))
                    val activityLog = ActivityLog(
                        id = json.getString("id"),
                        activityType = json.getString("activityType"),
                        description = json.getString("description"),
                        createdAt = createdAt ?: Date(), // Fallback to current date if parsing fails
                        isRead = json.getBoolean("isRead"),
                        incident = if (json.has("incident") && !json.isNull("incident")) {
                            val incidentJson = json.getJSONObject("incident")
                            IncidentInfo(
                                id = incidentJson.getString("id"),
                                trackingNumber = incidentJson.getString("trackingNumber")
                            )
                        } else null
                    )
                    _notificationFlow.tryEmit(activityLog)
                } catch (e: Exception) {
                    Log.e("WebSocketService", "Error parsing message: ${e.message}")
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("WebSocketService", "WebSocket failure: ${t.message}")
                // Attempt to reconnect after a delay
                reconnect(token)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("WebSocketService", "WebSocket closed: $reason")
            }
        })
    }

    private fun reconnect(token: String) {
        // Implement exponential backoff for reconnection
        webSocket?.close(1000, "Reconnecting")
        webSocket = null
        connect(token)
    }

    fun disconnect() {
        webSocket?.close(1000, "Disconnecting")
        webSocket = null
    }
}