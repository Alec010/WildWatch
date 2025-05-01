package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.wildwatch.api.RetrofitClient
import com.wildwatch.model.IncidentResponse
import com.wildwatch.repository.HistoryRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed class HistoryUiState {
    object Loading : HistoryUiState()
    data class Error(val message: String) : HistoryUiState()
    data class Success(val incidents: List<IncidentResponse>) : HistoryUiState()
}

class HistoryViewModel(
    private val repository: HistoryRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<HistoryUiState>(HistoryUiState.Loading)
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()
    
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    
    private val _selectedStatus = MutableStateFlow("All")
    val selectedStatus: StateFlow<String> = _selectedStatus.asStateFlow()
    
    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()
    
    private var allIncidents = listOf<IncidentResponse>()

    init {
        startIncidentUpdates()
    }

    private fun startIncidentUpdates() {
        viewModelScope.launch {
            repository.getIncidentHistoryFlow()
                .catch { e ->
                    _uiState.value = HistoryUiState.Error(e.message ?: "Failed to load incidents")
                }
                .collect { incidents ->
                    allIncidents = incidents
                    applyFilters()
                }
        }
    }
    
    fun refresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                allIncidents = repository.getIncidentHistory()
                applyFilters()
            } catch (e: Exception) {
                _uiState.value = HistoryUiState.Error(e.message ?: "Failed to refresh incidents")
            } finally {
                _isRefreshing.value = false
            }
        }
    }
    
    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
        applyFilters()
    }
    
    fun onStatusFilterChanged(status: String) {
        _selectedStatus.value = status
        applyFilters()
    }
    
    private fun applyFilters() {
        val query = _searchQuery.value.lowercase()
        val status = _selectedStatus.value
        
        val filteredIncidents = allIncidents.filter { incident ->
            val matchesSearch = query.isEmpty() || 
                incident.trackingNumber.lowercase().contains(query) ||
                incident.incidentType.lowercase().contains(query) ||
                incident.location.lowercase().contains(query)
                
            val matchesStatus = status == "All" || 
                incident.status.equals(status, ignoreCase = true)
                
            matchesSearch && matchesStatus
        }
        
        _uiState.value = HistoryUiState.Success(filteredIncidents)
    }

    override fun onCleared() {
        super.onCleared()
        // Clean up any resources if needed
    }
}

class HistoryViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(HistoryViewModel::class.java)) {
            val incidentApi = RetrofitClient.getIncidentApi(context)
            val repository = HistoryRepository(incidentApi)
            @Suppress("UNCHECKED_CAST")
            return HistoryViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
} 