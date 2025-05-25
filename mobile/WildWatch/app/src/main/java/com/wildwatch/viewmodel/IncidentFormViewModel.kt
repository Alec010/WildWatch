package com.wildwatch.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wildwatch.model.IncidentFormState
import com.wildwatch.model.IncidentRequest
import com.wildwatch.model.WitnessDTO
import com.wildwatch.repository.IncidentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.*

class IncidentFormViewModel(
    private val repository: IncidentRepository
) : ViewModel() {

    private val _formState = MutableStateFlow(IncidentFormState())
    val formState: StateFlow<IncidentFormState> = _formState

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    private val _isGeneratingTags = MutableStateFlow(false)
    val isGeneratingTags: StateFlow<Boolean> = _isGeneratingTags.asStateFlow()

    private val _generatedTags = MutableStateFlow<List<String>>(emptyList())
    val generatedTags: StateFlow<List<String>> = _generatedTags.asStateFlow()

    private val _selectedTags = MutableStateFlow<Set<String>>(emptySet())
    val selectedTags: StateFlow<Set<String>> = _selectedTags.asStateFlow()

    private var isSubmitting = false

    fun clearError() {
        _errorMessage.value = null
    }

    fun setError(message: String) {
        _errorMessage.value = message
    }

    fun updateFormState(update: IncidentFormState) {
        Log.d("IncidentFormViewModel", "🔥 [UPDATE] State = $update")
        _formState.value = update
    }

    fun addWitness(witness: WitnessDTO) {
        _formState.value = _formState.value.copy(
            witnesses = _formState.value.witnesses + witness
        )
    }

    fun removeWitness(index: Int) {
        val current = _formState.value.witnesses.toMutableList()
        if (index in current.indices) {
            current.removeAt(index)
            _formState.value = _formState.value.copy(witnesses = current)
        }
    }

    fun clearForm() {
        _formState.value = IncidentFormState()
    }

    fun addEvidence(uri: String, file: File) {
        if (file.exists()) {
            _formState.value = _formState.value.copy(
                evidenceUris = _formState.value.evidenceUris + uri,
                evidenceFiles = _formState.value.evidenceFiles + file
            )
            Log.d("IncidentFormViewModel", "Added evidence: ${file.name}")
        } else {
            Log.e("IncidentFormViewModel", "Failed to add evidence: File doesn't exist - ${file.absolutePath}")
        }
    }

    fun removeEvidence(index: Int) {
        val currentUris = _formState.value.evidenceUris.toMutableList()
        val currentFiles = _formState.value.evidenceFiles.toMutableList()
        if (index in currentUris.indices) {
            try {
                val file = currentFiles[index]
                if (file.exists()) {
                    file.delete()
                }
            } catch (e: Exception) {
                Log.e("IncidentFormViewModel", "Error deleting file: ${e.message}")
            }
            
            currentUris.removeAt(index)
            currentFiles.removeAt(index)
            _formState.value = _formState.value.copy(
                evidenceUris = currentUris,
                evidenceFiles = currentFiles
            )
            Log.d("IncidentFormViewModel", "Removed evidence at index $index")
        }
    }

    fun clearEvidence() {
        _formState.value.evidenceFiles.forEach { file ->
            try {
                if (file.exists()) {
                    file.delete()
                }
            } catch (e: Exception) {
                Log.e("IncidentFormViewModel", "Error deleting file: ${e.message}")
            }
        }
        
        _formState.value = _formState.value.copy(
            evidenceUris = emptyList(),
            evidenceFiles = emptyList()
        )
        Log.d("IncidentFormViewModel", "Cleared all evidence")
    }

    fun updateAdditionalNotes(notes: String) {
        _formState.value = _formState.value.copy(additionalNotes = notes)
    }

    fun submitIncident(onSuccess: () -> Unit, onError: (String) -> Unit) {
        if (isSubmitting) {
            Log.w("DEBUG", "🚫 submitIncident() blocked: already submitting!")
            return
        }
        isSubmitting = true
        Log.d("DEBUG", "🚀 submitIncident() started")

        val form = formState.value
        try {
            // Prepare the IncidentRequest with all necessary fields
            val request = IncidentRequest(
                incidentType = form.incidentType,
                dateOfIncident = LocalDate.parse(
                    form.dateOfIncident,
                    DateTimeFormatter.ofPattern("MM/dd/yyyy")
                ).format(DateTimeFormatter.ISO_LOCAL_DATE),
                timeOfIncident = LocalTime.parse(
                    form.timeOfIncident,
                    DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)
                ).format(DateTimeFormatter.ofPattern("HH:mm")),
                location = form.location,
                description = form.description,
                assignedOffice = form.assignedOffice,
                witnesses = form.witnesses,
                additionalNotes = form.additionalNotes,
                evidenceUris = form.evidenceUris,
                evidenceFiles = form.evidenceFiles,
                preferAnonymous = form.preferAnonymous
            )

            viewModelScope.launch {
                try {
                    // Submit the incident to the repository with the evidence files
                    val response = repository.createIncident(request, form.evidenceFiles)
                    if (response.isSuccessful) {
                        Log.d("DEBUG", "✅ submitIncident(): Success! Calling onSuccess()")
                        onSuccess()
                    } else {
                        Log.e("DEBUG", "❌ submitIncident(): Failed — ${response.code()} ${response.message()}")
                        onError("Failed: ${response.code()} ${response.message()}")
                    }
                } catch (e: Exception) {
                    Log.e("DEBUG", "🚫 submitIncident(): Network error — ${e.localizedMessage}")
                    onError("Network Error: ${e.localizedMessage}")
                } finally {
                    isSubmitting = false
                    Log.d("DEBUG", "🔓 submitIncident(): isSubmitting unlocked")
                }
            }
        } catch (e: Exception) {
            onError("Parsing Error: ${e.localizedMessage}")
            isSubmitting = false
            Log.d("DEBUG", "🔓 submitIncident(): isSubmitting unlocked (parsing error)")
        }
    }

    // Methods for updating fields
    fun updateIncidentType(incidentType: String) {
        _formState.value = _formState.value.copy(incidentType = incidentType)
    }

    fun updateDescription(description: String) {
        _formState.value = _formState.value.copy(description = description)
    }

    fun updateLocation(location: String) {
        _formState.value = _formState.value.copy(location = location)
    }

    fun updateAssignedOffice(assignedOffice: String) {
        _formState.value = _formState.value.copy(assignedOffice = assignedOffice)
    }

    fun updateDateOfIncident(date: String) {
        _formState.value = _formState.value.copy(dateOfIncident = date)
    }

    fun updateTimeOfIncident(time: String) {
        _formState.value = _formState.value.copy(timeOfIncident = time)
    }

    fun generateTags(description: String, location: String) {
        viewModelScope.launch {
            _isGeneratingTags.value = true
            _errorMessage.value = null
            try {
                val response = repository.generateTags(description, location)
                if (response.isSuccessful) {
                    response.body()?.let { tagResponse ->
                        _generatedTags.value = tagResponse.tags
                    }
                } else {
                    _errorMessage.value = "Failed to generate tags"
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message ?: "An error occurred"
            } finally {
                _isGeneratingTags.value = false
            }
        }
    }

    fun toggleTag(tag: String) {
        val currentSelectedTags = _selectedTags.value.toMutableSet()
        if (currentSelectedTags.contains(tag)) {
            currentSelectedTags.remove(tag)
        } else if (currentSelectedTags.size < 5) {
            currentSelectedTags.add(tag)
        }
        _selectedTags.value = currentSelectedTags
        
        // Update form state with selected tags while preserving all other fields
        val currentState = _formState.value
        _formState.value = currentState.copy(
            incidentType = currentState.incidentType,
            dateOfIncident = currentState.dateOfIncident,
            timeOfIncident = currentState.timeOfIncident,
            location = currentState.location,
            assignedOffice = currentState.assignedOffice,
            description = currentState.description,
            witnesses = currentState.witnesses,
            evidenceUris = currentState.evidenceUris,
            evidenceFiles = currentState.evidenceFiles,
            additionalNotes = currentState.additionalNotes,
            tags = currentSelectedTags.toList()
        )
    }
}
