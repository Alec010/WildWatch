package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wildwatch.api.RetrofitClient
import com.wildwatch.model.IncidentResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException

class DashboardViewModel(context: Context) : ViewModel() {

    private val repository = com.wildwatch.repository.CaseRepository(context)  // ✅ Reusing your existing repository!

    private val _totalReports = MutableStateFlow(0)
    val totalReports: StateFlow<Int> = _totalReports

    private val _pendingReports = MutableStateFlow(0)
    val pendingReports: StateFlow<Int> = _pendingReports

    private val _inProgressReports = MutableStateFlow(0)
    val inProgressReports: StateFlow<Int> = _inProgressReports

    private val _resolvedReports = MutableStateFlow(0)
    val resolvedReports: StateFlow<Int> = _resolvedReports

    private val _recentIncidents = MutableStateFlow<List<IncidentResponse>>(emptyList())
    val recentIncidents: StateFlow<List<IncidentResponse>> = _recentIncidents

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun fetchDashboardData() {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            try {
                val incidents = repository.getUserIncidents()

                _totalReports.value = incidents.size
                _pendingReports.value = incidents.count { it.status == "Pending" }
                _inProgressReports.value = incidents.count { it.status == "In Progress" }
                _resolvedReports.value = incidents.count { it.status == "Resolved" }

                _recentIncidents.value = incidents.sortedByDescending { it.submittedAt }.take(5)

            } catch (e: IOException) {
                _error.value = "Network error: Please check your internet connection."
            } catch (e: HttpException) {
                _error.value = "Server error: ${e.code()} ${e.message()}"
            } catch (e: Exception) {
                _error.value = "Unexpected error: ${e.localizedMessage}"
            } finally {
                _loading.value = false
            }
        }
    }
}
