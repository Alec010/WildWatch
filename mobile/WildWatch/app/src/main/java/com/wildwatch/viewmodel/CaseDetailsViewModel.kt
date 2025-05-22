package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.IncidentResponse
import com.wildwatch.repository.CaseRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException

sealed class CaseDetailsUiState {
    object Loading : CaseDetailsUiState()
    data class Error(val message: String) : CaseDetailsUiState()
    data class Success(val incident: IncidentResponse) : CaseDetailsUiState()
}

class CaseDetailsViewModel(context: Context) : ViewModel() {
    private val repository = CaseRepository(context)

    private val _uiState = MutableStateFlow<CaseDetailsUiState>(CaseDetailsUiState.Loading)
    val uiState: StateFlow<CaseDetailsUiState> = _uiState

    fun fetchCaseDetails(trackingNumber: String) {
        viewModelScope.launch {
            _uiState.value = CaseDetailsUiState.Loading
            try {
                val incident = repository.getIncidentById(trackingNumber)
                _uiState.value = CaseDetailsUiState.Success(incident)
            } catch (e: IOException) {
                _uiState.value = CaseDetailsUiState.Error("Network error: Please check your connection.")
            } catch (e: HttpException) {
                _uiState.value = CaseDetailsUiState.Error("Server error: ${e.code()} ${e.message()}")
            } catch (e: Exception) {
                _uiState.value = CaseDetailsUiState.Error("Unexpected error: ${e.localizedMessage}")
            }
        }
    }
}

class CaseDetailsViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CaseDetailsViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return CaseDetailsViewModel(context) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
} 