package com.wildwatch.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.LoginResponse
import com.wildwatch.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {
    private val repository = AuthRepository()

    private val _loginResult = MutableStateFlow<Result<LoginResponse>?>(null)
    val loginResult = _loginResult.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginResult.value = repository.login(email, password)
        }
    }
}