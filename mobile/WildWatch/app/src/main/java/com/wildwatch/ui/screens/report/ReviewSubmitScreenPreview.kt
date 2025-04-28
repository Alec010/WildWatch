package com.wildwatch.ui.screens.report

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.tooling.preview.Preview
import com.wildwatch.api.RetrofitClient
import com.wildwatch.repository.IncidentRepository
import com.wildwatch.ui.theme.WildWatchTheme
import com.wildwatch.viewmodel.IncidentFormViewModel

@Preview(showBackground = true)
@Composable
fun PreviewReviewSubmitScreen() {
    val repo = IncidentRepository(RetrofitClient.incidentApi)
    val viewModel = remember { IncidentFormViewModel(repo) }

    ReviewSubmitScreen(
        formViewModel = viewModel
    )
}
