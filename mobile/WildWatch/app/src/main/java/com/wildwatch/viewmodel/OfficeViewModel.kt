package com.wildwatch.viewmodel

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.Office
import com.wildwatch.repository.OfficeRepository
import com.wildwatch.model.OfficeResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class OfficeViewModel(private val officeRepository: OfficeRepository) : ViewModel() {
    private val _offices = MutableStateFlow<List<Office>>(emptyList())
    val offices: StateFlow<List<Office>> get() = _offices

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> get() = _loading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> get() = _error

    // In OfficeViewModel
    fun fetchOffices(token: String) {
        viewModelScope.launch {
            _loading.value = true
            try {
                val response = officeRepository.getOffices(token) // Call API
                if (response.isSuccessful) {
                    val officesList = response.body()?.map { officeResponse ->
                        Office(
                            code = officeResponse.code,
                            fullName = officeResponse.fullName,
                            description = officeResponse.description
                        )
                    } ?: emptyList()
                    _offices.value = officesList
                    _error.value = null
                } else {
                    _error.value = "Error fetching offices: ${response.code()}"
                }
            } catch (e: Exception) {
                _error.value = "Failed to load offices: ${e.localizedMessage}"
            } finally {
                _loading.value = false
            }
        }
    }
}
