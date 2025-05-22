package com.wildwatch.viewmodel

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.Activity
import com.wildwatch.model.IncidentResponse
import com.wildwatch.repository.CaseRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException

class CaseTrackingViewModel(context: Context) : ViewModel() {

    private val repository = CaseRepository(context)

    private val _cases = MutableStateFlow<List<IncidentResponse>>(emptyList())
    val cases: StateFlow<List<IncidentResponse>> = _cases

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _activitiesLoading = MutableStateFlow(false)
    val activitiesLoading: StateFlow<Boolean> = _activitiesLoading

    private val _activitiesError = MutableStateFlow<String?>(null)
    val activitiesError: StateFlow<String?> = _activitiesError

    private val _recentActivities = MutableStateFlow<List<Activity>>(emptyList())
    val recentActivities: StateFlow<List<Activity>> = _recentActivities

    private val _totalPages = MutableStateFlow(0)
    val totalPages: StateFlow<Int> = _totalPages

    private val _currentPage = MutableStateFlow(0)
    val currentPage: StateFlow<Int> = _currentPage

    private val _totalActivities = MutableStateFlow(0)
    val totalActivities: StateFlow<Int> = _totalActivities

    // Add this at the top of your ViewModel
    private val _selectedStatus = MutableStateFlow("All") // Default is "All"
    val selectedStatus: StateFlow<String> = _selectedStatus

    val filteredCases: StateFlow<List<IncidentResponse>> = combine(_cases, _searchQuery, _selectedStatus) { cases, query, status ->
        cases.filter {
            (it.status == status || status == "All") && // Check status filter
                    (it.incidentType.contains(query, ignoreCase = true) ||
                            it.location.contains(query, ignoreCase = true) ||
                            it.trackingNumber.contains(query, ignoreCase = true)) // Check search query
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())


    // ✅ Status Counts (calculated from the full case list)
    val pendingCount: StateFlow<Int> = _cases.map { cases -> cases.count { it.status == "Pending" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val inProgressCount: StateFlow<Int> = _cases.map { cases -> cases.count { it.status == "In Progress" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val resolvedCount: StateFlow<Int> = _cases.map { cases -> cases.count { it.status == "Resolved" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun fetchUserIncidents() {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            try {
                _cases.value = repository.getUserIncidents()
            } catch (e: IOException) {
                _error.value = "Network error: Please check your connection."
            } catch (e: HttpException) {
                _error.value = "Server error: ${e.code()} ${e.message()}"
            } catch (e: Exception) {
                _error.value = "Unexpected error: ${e.localizedMessage}"
            } finally {
                _loading.value = false
            }
        }
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun updateSelectedStatus(status: String) {
        _selectedStatus.value = status
    }

    fun fetchActivities(page: Int = _currentPage.value) {
        viewModelScope.launch {
            _activitiesLoading.value = true
            _activitiesError.value = null
            try {
                val response = repository.getUserActivities(page, size = 10)
                _recentActivities.value = response.content
                _totalPages.value = response.totalPages
                _totalActivities.value = response.totalElements
                _currentPage.value = page
                Log.d("CaseTracking", "Fetched ${response.content.size} activities")
            } catch (e: IOException) {
                _activitiesError.value = "Network error: Please check your connection."
                Log.e("CaseTracking", "Network error fetching activities: ${e.localizedMessage}")
            } catch (e: HttpException) {
                _activitiesError.value = "Server error: ${e.code()} ${e.message()}"
                Log.e("CaseTracking", "Server error fetching activities: ${e.localizedMessage}")
            } catch (e: Exception) {
                _activitiesError.value = "Unexpected error: ${e.localizedMessage}"
                Log.e("CaseTracking", "Error fetching activities: ${e.localizedMessage}")
            } finally {
                _activitiesLoading.value = false
            }
        }
    }


    fun nextPage() {
        if (_currentPage.value < _totalPages.value - 1) {
            fetchActivities(_currentPage.value + 1)
        }
    }

    fun previousPage() {
        if (_currentPage.value > 0) {
            fetchActivities(_currentPage.value - 1)
        }
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }
}

