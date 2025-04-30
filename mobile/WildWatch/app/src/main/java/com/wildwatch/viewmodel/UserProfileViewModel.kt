package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wildwatch.api.RetrofitClient
import com.wildwatch.model.UserProfile
import com.wildwatch.model.UserUpdateRequest
import com.wildwatch.utils.TokenManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class UserProfileViewModel : ViewModel() {
    private val _user = MutableStateFlow<UserProfile?>(null)
    val user: StateFlow<UserProfile?> = _user.asStateFlow()

    fun fetchProfile(context: Context) {
        viewModelScope.launch {
            val token = TokenManager.getToken(context) // Static call
            if (token != null) {
                val response = RetrofitClient.authApi.getProfile("Bearer $token")
                if (response.isSuccessful) {
                    _user.value = response.body()
                }
            }
        }
    }

    fun updateUserProfile(
        context: Context,
        updated: UserUpdateRequest,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            val token = TokenManager.getToken(context) // Static call
            if (token != null) {
                try {
                    val response = RetrofitClient.authApi.updateUser("Bearer $token", updated)
                    val updatedUser = response.body()
                    if (response.isSuccessful) {
                        _user.value = updatedUser?.copy(
                            role = updatedUser?.role ?: _user.value?.role ?: ""
                        )
                        onSuccess()
                    } else {
                        onError("Update failed: ${response.code()}")
                    }
                } catch (e: Exception) {
                    onError("Exception: ${e.message}")
                }
            } else {
                onError("Token missing")
            }
        }
    }
}
