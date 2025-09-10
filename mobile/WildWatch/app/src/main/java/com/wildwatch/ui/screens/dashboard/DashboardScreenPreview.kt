package com.wildwatch.ui.screens.dashboard

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import com.wildwatch.ui.theme.WildWatchTheme
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.viewmodel.PublicIncidentsViewModel
import com.wildwatch.viewmodel.PublicIncidentsViewModelFactory

@Preview(showBackground = true)
@Composable
fun DashboardScreenPreview() {
    val context = LocalContext.current
    val viewModel: PublicIncidentsViewModel = viewModel(
        factory = PublicIncidentsViewModelFactory(context)
    )
    
    WildWatchTheme {
        DashboardScreen(
            navController = rememberNavController(),
            viewModel = viewModel,
            onIncidentClick = {},
            onViewAllClick = {},
            onViewAllNotifications = {}
        )
    }
}

