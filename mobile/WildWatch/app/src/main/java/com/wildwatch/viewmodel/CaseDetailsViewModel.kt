package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.IncidentResponse
import com.wildwatch.model.IncidentRatingResponse
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

    private val _ratingStatus = MutableStateFlow<IncidentRatingResponse?>(null)
    val ratingStatus: StateFlow<IncidentRatingResponse?> = _ratingStatus

    fun fetchIncidentById(id: String) {
        viewModelScope.launch {
            _uiState.value = CaseDetailsUiState.Loading
            try {
                // Try to fetch by tracking number first (for public incidents)
                val incident = try {
                    repository.getIncidentByTrackingNumber(id)
                } catch (e: Exception) {
                    // If that fails, try to fetch by ID (for user incidents)
                    repository.getIncidentById(id)
                }
                _uiState.value = CaseDetailsUiState.Success(incident)
            } catch (e: IOException) {
                android.util.Log.e("CaseDetailsViewModel", "Network error: ${e.localizedMessage}", e)
                _uiState.value = CaseDetailsUiState.Error("Network error: Please check your connection.")
            } catch (e: retrofit2.HttpException) {
                android.util.Log.e("CaseDetailsViewModel", "HTTP error: ${e.code()} ${e.message()}", e)
                val errorBody = e.response()?.errorBody()?.string()
                android.util.Log.e("CaseDetailsViewModel", "Error body: $errorBody")
                _uiState.value = CaseDetailsUiState.Error("Server error: ${e.code()} ${e.message()}")
            } catch (e: Exception) {
                android.util.Log.e("CaseDetailsViewModel", "Unexpected error: ${e.localizedMessage}", e)
                _uiState.value = CaseDetailsUiState.Error("Unexpected error: ${e.localizedMessage}")
            }
        }
    }

    fun submitRating(trackingNumber: String, rating: Int, feedback: String) {
        viewModelScope.launch {
            try {
                val updatedRating = repository.submitRating(trackingNumber, rating, feedback)
                _ratingStatus.value = updatedRating
            } catch (e: IOException) {
                // Optionally handle error
            } catch (e: HttpException) {
                // Optionally handle error
            } catch (e: Exception) {
                // Optionally handle error
            }
        }
    }

    fun fetchRatingStatus(trackingNumber: String) {
        viewModelScope.launch {
            try {
                val status = repository.getIncidentRatingStatus(trackingNumber)
                _ratingStatus.value = status
            } catch (e: Exception) {
                _ratingStatus.value = null
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