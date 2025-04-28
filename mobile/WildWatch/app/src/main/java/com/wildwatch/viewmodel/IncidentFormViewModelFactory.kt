package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.wildwatch.api.RetrofitClient
import com.wildwatch.repository.IncidentRepository

class IncidentFormViewModelFactory(
    private val context: Context
) : ViewModelProvider.Factory {

    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(IncidentFormViewModel::class.java)) {
            val incidentApi = RetrofitClient.getIncidentApi(context) // ✅ uses secure token-based API
            val repository = IncidentRepository(incidentApi)
            @Suppress("UNCHECKED_CAST")
            return IncidentFormViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
