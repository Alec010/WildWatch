package com.wildwatch.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider

class CaseTrackingViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CaseTrackingViewModel::class.java)) {
            return CaseTrackingViewModel(context) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
