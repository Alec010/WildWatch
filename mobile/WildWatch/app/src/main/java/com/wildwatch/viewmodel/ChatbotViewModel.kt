package com.wildwatch.viewmodel

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.ChatMessage
import com.wildwatch.network.ApiService
import com.wildwatch.network.ChatRequest
import com.wildwatch.api.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ChatbotViewModel(context: Context) : ViewModel() {
    private val apiService = RetrofitClient.getChatbotApi(context)

    private val _messages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                "bot",
                "Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?"
            )
        )
    )
    val messages: StateFlow<List<ChatMessage>> = _messages

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun sendMessage(message: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                // Add user message to the list
                _messages.value = _messages.value + ChatMessage("user", message)

                // Call API
                val response = apiService.chat(ChatRequest(message))
                // Add bot response to the list
                _messages.value = _messages.value + ChatMessage("bot", response.reply)
            } catch (e: Exception) {
                Log.e("ChatbotViewModel", "Chat error", e)
                _messages.value = _messages.value + ChatMessage(
                    "bot",
                    "Sorry, I encountered an error. Please try again in a moment."
                )
            } finally {
                _isLoading.value = false
            }
        }
    }
}

class ChatbotViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ChatbotViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ChatbotViewModel(context) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
} 