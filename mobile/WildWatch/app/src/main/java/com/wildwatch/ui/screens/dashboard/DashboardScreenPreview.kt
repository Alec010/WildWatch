package com.wildwatch.ui.screens.dashboard

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import com.wildwatch.ui.theme.WildWatchTheme

@Preview(showBackground = true)
@Composable
fun DashboardScreenPreview() {
    WildWatchTheme {
        val navController = rememberNavController()
        DashboardScreen(
            navController = navController,
            onIncidentClick = {},
            onViewAllClick = {},
            onViewAllNotifications = {}
        )
    }
}

