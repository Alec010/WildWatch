package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.wildwatch.api.RetrofitClient
import com.wildwatch.model.IncidentResponse
import com.wildwatch.repository.CaseRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.retry
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.onCompletion
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.TimeoutCancellationException
import java.io.IOException
import java.net.UnknownHostException
import java.net.SocketTimeoutException
import java.net.ConnectException
import kotlinx.coroutines.async

class PublicIncidentsViewModel(
    private val repository: CaseRepository
) : ViewModel() {

    private val _publicIncidents = MutableStateFlow<List<IncidentResponse>>(emptyList())
    val publicIncidents: StateFlow<List<IncidentResponse>> = _publicIncidents.asStateFlow()

    private val _userIncidents = MutableStateFlow<List<IncidentResponse>>(emptyList())
    val userIncidents: StateFlow<List<IncidentResponse>> = _userIncidents.asStateFlow()

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _upvotedIncidents = MutableStateFlow<Set<String>>(emptySet())
    val upvotedIncidents: StateFlow<Set<String>> = _upvotedIncidents.asStateFlow()

    fun fetchPublicIncidents() {
        viewModelScope.launch {
            flow<Unit> {
                try {
                    withTimeout(30000) { // 30 second timeout
                        // Fetch public incidents
                        val publicIncidents = repository.getPublicIncidents()
                        _publicIncidents.value = publicIncidents
                        
                        // Fetch upvote statuses for public incidents
                        val upvotedIds = publicIncidents.mapNotNull { incident ->
                            try {
                                if (repository.getUpvoteStatus(incident.id)) incident.id else null
                            } catch (e: Exception) {
                                null
                            }
                        }.toSet()
                        _upvotedIncidents.value = upvotedIds
                    }
                } catch (e: TimeoutCancellationException) {
                    _error.value = "Request timed out. Please try again."
                    throw e
                }
            }
            .onStart<Unit> { 
                _loading.value = true
                _error.value = null
            }
            .retry<Unit>(3) { cause ->
                cause is IOException || cause is UnknownHostException || 
                cause is SocketTimeoutException || cause is ConnectException
            }
            .catch<Unit> { e ->
                _error.value = when (e) {
                    is UnknownHostException -> "No internet connection. Please check your network."
                    is SocketTimeoutException -> "Connection timed out. Please try again."
                    is ConnectException -> "Could not connect to server. Please try again."
                    is IOException -> "Network error. Please check your connection."
                    is TimeoutCancellationException -> "Request timed out. Please try again."
                    else -> "An error occurred: ${e.message}"
                }
            }
            .onCompletion<Unit> { 
                _loading.value = false
                _isRefreshing.value = false
            }
            .collect()
        }
    }

    fun fetchUserIncidents() {
        viewModelScope.launch {
            flow<Unit> {
                try {
                    withTimeout(30000) { // 30 second timeout
                        // Fetch user incidents
                        val userIncidents = repository.getUserIncidents()
                        _userIncidents.value = userIncidents
                    }
                } catch (e: TimeoutCancellationException) {
                    _error.value = "Request timed out. Please try again."
                    throw e
                }
            }
            .onStart<Unit> { 
                _loading.value = true
                _error.value = null
            }
            .retry<Unit>(3) { cause ->
                cause is IOException || cause is UnknownHostException || 
                cause is SocketTimeoutException || cause is ConnectException
            }
            .catch<Unit> { e ->
                _error.value = when (e) {
                    is UnknownHostException -> "No internet connection. Please check your network."
                    is SocketTimeoutException -> "Connection timed out. Please try again."
                    is ConnectException -> "Could not connect to server. Please try again."
                    is IOException -> "Network error. Please check your connection."
                    is TimeoutCancellationException -> "Request timed out. Please try again."
                    else -> "An error occurred: ${e.message}"
                }
            }
            .onCompletion<Unit> { 
                _loading.value = false
                _isRefreshing.value = false
            }
            .collect()
        }
    }

    fun toggleUpvote(incidentId: String) {
        viewModelScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    withTimeout(10000) { // 10 second timeout
                        val isUpvoted = repository.toggleUpvote(incidentId)
                        _upvotedIncidents.update { currentSet ->
                            if (isUpvoted) currentSet + incidentId else currentSet - incidentId
                        }
                        
                        // Update the upvote count in the current list without refetching
                        _publicIncidents.update { currentIncidents ->
                            currentIncidents.map { incident ->
                                if (incident.id == incidentId) {
                                    incident.copy(
                                        upvoteCount = (incident.upvoteCount ?: 0) + if (isUpvoted) 1 else -1
                                    )
                                } else incident
                            }
                        }
                    }
                }
            } catch (e: TimeoutCancellationException) {
                _error.value = "Request timed out. Please try again."
            } catch (e: Exception) {
                _error.value = "Failed to update upvote: ${e.message}"
            }
        }
    }

    fun refresh() {
        _isRefreshing.value = true
        _error.value = null
        fetchPublicIncidents()
        fetchUserIncidents()
    }
}
