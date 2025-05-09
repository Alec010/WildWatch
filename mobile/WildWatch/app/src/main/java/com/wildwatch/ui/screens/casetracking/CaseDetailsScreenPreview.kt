package com.wildwatch.ui.screens.casetracking

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import com.wildwatch.ui.theme.WildWatchTheme
import com.wildwatch.viewmodel.CaseDetailsViewModel
import com.wildwatch.viewmodel.CaseDetailsViewModelFactory

@Preview(showBackground = true)
@Composable
fun CaseDetailsScreenPreview() {
    val context = LocalContext.current
    val viewModel = CaseDetailsViewModelFactory(context).create(CaseDetailsViewModel::class.java)
    WildWatchTheme {
        CaseDetailsScreen(
            viewModel = viewModel,
            trackingNumber = "CASE-123",
            onBackClick = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
fun CaseDetailsScreenDarkPreview() {
    val context = LocalContext.current
    val viewModel = CaseDetailsViewModelFactory(context).create(CaseDetailsViewModel::class.java)
    WildWatchTheme {
        CaseDetailsScreen(
            viewModel = viewModel,
            trackingNumber = "CASE-123",
            onBackClick = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
fun CaseDetailsScreenDismissedPreview() {
    val context = LocalContext.current
    val viewModel = CaseDetailsViewModelFactory(context).create(CaseDetailsViewModel::class.java)
    WildWatchTheme {
        CaseDetailsScreen(
            viewModel = viewModel,
            trackingNumber = "CASE-123",
            onBackClick = {}
        )
    }
}
