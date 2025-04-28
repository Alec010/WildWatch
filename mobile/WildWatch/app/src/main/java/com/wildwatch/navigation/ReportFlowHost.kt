package com.wildwatch.navigation

import android.util.Log
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.viewmodel.IncidentFormViewModel
import com.wildwatch.viewmodel.IncidentFormViewModelFactory
import com.wildwatch.ui.screens.report.*

enum class ReportStep { INCIDENT, EVIDENCE, REVIEW }

@Composable
fun ReportFlowHost(
    onExit: () -> Unit
) {
    val context = LocalContext.current
    val formViewModel: IncidentFormViewModel = viewModel(
        factory = IncidentFormViewModelFactory(context)
    )

    var currentStep by rememberSaveable { mutableStateOf(ReportStep.INCIDENT) }
    var isSubmitting by rememberSaveable { mutableStateOf(false) }

    Log.d("DEBUG", "🌀 ReportFlowHost recomposed: currentStep = $currentStep, isSubmitting = $isSubmitting")

    when (currentStep) {
        ReportStep.INCIDENT -> ReportIncidentScreen(
            formViewModel = formViewModel,
            onBackClick = onExit,
            onContinueClick = { currentStep = ReportStep.EVIDENCE }
        )
        ReportStep.EVIDENCE -> EvidenceWitnessScreen(
            formViewModel = formViewModel,
            onBackClick = { currentStep = ReportStep.INCIDENT },
            onContinueClick = { currentStep = ReportStep.REVIEW }
        )
        ReportStep.REVIEW -> ReviewSubmitScreen(
            formViewModel = formViewModel,
            isSubmitting = isSubmitting,
            onBackClick = { currentStep = ReportStep.EVIDENCE },
            onSubmitClick = {
                Log.d("DEBUG", "🟢 Submit button clicked! isSubmitting = $isSubmitting")
                if (isSubmitting) {
                    Log.w("DEBUG", "🚫 Submit blocked — already submitting!")
                    return@ReviewSubmitScreen
                }
                isSubmitting = true

                formViewModel.submitIncident(
                    onSuccess = {
                        Log.d("DEBUG", "✅ onSuccess in ReportFlowHost: clearing form and exiting")
                        isSubmitting = false
                        formViewModel.clearForm()
                        currentStep = ReportStep.INCIDENT  // reset state before navigating away
                        onExit()
                    },
                    onError = { error ->
                        isSubmitting = false
                        Log.e("DEBUG", "❌ Error submitting incident: $error")
                    }
                )
            }
        )
    }
}
