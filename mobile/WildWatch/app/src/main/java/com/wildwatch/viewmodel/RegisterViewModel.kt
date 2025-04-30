package com.wildwatch.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.RegisterRequest
import com.wildwatch.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class RegisterViewModel : ViewModel() {
    private val repository = AuthRepository()

    private val _registerResult = MutableStateFlow<Result<Unit>?>(null)
    val registerResult = _registerResult.asStateFlow()

    fun register(request: RegisterRequest) {
        viewModelScope.launch {
            _registerResult.value = repository.registerUser(request)
        }
    }
}
