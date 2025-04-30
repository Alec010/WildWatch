package com.wildwatch.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.wildwatch.repository.OfficeRepository

class OfficeViewModelFactory(
    private val repository: OfficeRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(OfficeViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return OfficeViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
