package com.wildwatch.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.wildwatch.navigation.BottomNavItem
import com.wildwatch.ui.components.bottomnav.WildWatchBottomNavigation
import com.wildwatch.ui.screens.dashboard.DashboardScreen
import com.wildwatch.ui.screens.profile.ProfileScreen
import com.wildwatch.ui.screens.report.ReportIncidentScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Define navigation items
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

    // Use a Box instead of Scaffold to have more control over the layout
    Box(modifier = Modifier.fillMaxSize()) {
        // Content area
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 52.dp) // Match the height of the navigation bar
        ) {
            NavHost(
                navController = navController,
                startDestination = "dashboard"
            ) {
                composable("dashboard") {
                    DashboardScreen()
                }
                composable("history") {
                    PlaceholderScreen("History")
                }
                composable("report") {
                    ReportIncidentScreen()
                }
                composable("cases") {
                    PlaceholderScreen("Case Tracking")
                }
                composable("settings") {
                    ProfileScreen()
                }
            }
        }

        // Bottom navigation
        WildWatchBottomNavigation(
            items = bottomNavItems,
            selectedItemRoute = currentRoute ?: "dashboard",
            onItemSelected = { item ->
                navController.navigate(item.route) {
                    popUpTo(navController.graph.startDestinationId) {
                        saveState = true
                    }
                    launchSingleTop = true
                    restoreState = true
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
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

