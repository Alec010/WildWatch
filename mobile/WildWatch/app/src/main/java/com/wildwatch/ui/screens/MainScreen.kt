package com.wildwatch.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.wildwatch.navigation.BottomNavItem
import com.wildwatch.navigation.Screen
import com.wildwatch.ui.components.bottomnav.WildWatchBottomNavigation
import com.wildwatch.ui.screens.casetracking.CaseTrackingScreen
import com.wildwatch.ui.screens.dashboard.DashboardScreen
import com.wildwatch.ui.screens.profile.ProfileScreen

@Composable
fun MainScreen(
    navController: NavController,
    currentTab: String,                      // ✅ Tab now comes from parent
    onTabChange: (String) -> Unit
) {
    val bottomNavItems = listOf(
        BottomNavItem(
            route = "dashboard",
            title = "Dashboard",
            icon = Icons.Default.ShowChart
        ),
        BottomNavItem(
            route = "history",
            title = "History",
            icon = Icons.Default.History
        ),
        BottomNavItem(
            route = "report",
            title = "Report Incident",
            icon = Icons.Default.Warning,
            isFab = true
        ),
        BottomNavItem(
            route = "cases",
            title = "Case Tracking",
            icon = Icons.Default.Assignment
        ),
        BottomNavItem(
            route = "settings",
            title = "Settings",
            icon = Icons.Default.Settings
        )
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 52.dp) // leave space for bottom nav
        ) {
            when (currentTab) {
                "dashboard" -> DashboardScreen()
                "history" -> PlaceholderScreen("History")
                "cases" -> CaseTrackingScreen()
                "settings" -> ProfileScreen()
            }
        }

        WildWatchBottomNavigation(
            items = bottomNavItems,
            selectedItemRoute = currentTab,
            onItemSelected = { item ->
                if (item.route == "report") {
                    navController.navigate(Screen.ReportFlow.route)
                } else {
                    onTabChange(item.route)         // ✅ Update the state via the parent!
                }
            },
            modifier = Modifier.align(Alignment.BottomCenter)
        )
    }
}

@Composable
fun PlaceholderScreen(screenName: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = screenName,
            style = MaterialTheme.typography.headlineMedium
        )
    }
}
