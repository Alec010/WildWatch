package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.wildwatch.repository.CaseRepository

class PublicIncidentsViewModelFactory(
    private val context: Context
) : ViewModelProvider.Factory {

    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(PublicIncidentsViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return PublicIncidentsViewModel(CaseRepository(context)) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
} 