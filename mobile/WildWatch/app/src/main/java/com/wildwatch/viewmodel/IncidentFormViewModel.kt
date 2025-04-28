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
    private var isSubmitting = false  // ✅ Add this at the top of your ViewModel
    val formState: StateFlow<IncidentFormState> = _formState

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    fun clearError() {
        _errorMessage.value = null
    }

    fun setError(message: String) {
        _errorMessage.value = message
    }

    fun updateFormState(update: IncidentFormState) {
        println("🔥 [UPDATE] State = $update")
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

    fun submitIncident(
        evidenceFiles: List<File> = emptyList(),
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        if (isSubmitting) {
            Log.w("DEBUG", "🚫 submitIncident() blocked: already submitting!")
            return
        }
        isSubmitting = true
        Log.d("DEBUG", "🚀 submitIncident() started")

        val form = formState.value
        try {
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
                witnesses = form.witnesses
            )

            viewModelScope.launch {
                try {
                    val response = repository.createIncident(request, evidenceFiles)
                    val responseBody = response.body()
                    if (response.isSuccessful && responseBody != null) {
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

    fun updateAdditionalNotes(notes: String) {
        _formState.value = _formState.value.copy(additionalNotes = notes)
    }

    fun updateWitness(index: Int, witness: WitnessDTO) {
        val current = _formState.value.witnesses.toMutableList()
        if (index in current.indices) {
            current[index] = witness
            _formState.value = _formState.value.copy(witnesses = current)
        }
    }
    fun addEvidence(uri: String) {
        if (!_formState.value.evidenceUris.contains(uri)) {
            _formState.value = _formState.value.copy(
                evidenceUris = _formState.value.evidenceUris + uri
            )
        }
    }


    fun removeEvidence(index: Int) {
        val current = _formState.value.evidenceUris.toMutableList()
        if (index in current.indices) {
            current.removeAt(index)
            _formState.value = _formState.value.copy(evidenceUris = current)
        }
    }

}
