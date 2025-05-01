package com.wildwatch.ui.screens

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.wildwatch.navigation.BottomNavItem
import com.wildwatch.navigation.Screen
import com.wildwatch.ui.components.bottomnav.WildWatchBottomNavigation
import com.wildwatch.ui.screens.casetracking.CaseTrackingScreen
import com.wildwatch.ui.screens.dashboard.DashboardScreen
import com.wildwatch.ui.screens.history.HistoryScreen
import com.wildwatch.ui.screens.profile.ProfileScreen
import com.wildwatch.viewmodel.CaseTrackingViewModel
import com.wildwatch.viewmodel.CaseTrackingViewModelFactory
import com.wildwatch.utils.TokenManager
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope

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

    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current
    var shouldNavigateToLogin by remember { mutableStateOf(false) }

    // Handle navigation when shouldNavigateToLogin becomes true
    LaunchedEffect(shouldNavigateToLogin) {
        if (shouldNavigateToLogin) {
            Log.d("WildWatch", "🔄 Navigating to login screen...")
            navController.navigate(Screen.Login.route) {
                popUpTo(Screen.Main.route) { inclusive = true }
            }
            Log.d("WildWatch", "✅ Navigation to login screen completed")
            shouldNavigateToLogin = false
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 52.dp) // leave space for bottom nav
        ) {
            when (currentTab) {
                "dashboard" -> DashboardScreen()
                "history" -> HistoryScreen()
                "cases" -> {
                    val caseTrackingViewModel: CaseTrackingViewModel = viewModel(
                        factory = CaseTrackingViewModelFactory(context)
                    )
                    CaseTrackingScreen(viewModel = caseTrackingViewModel)
                }
                "settings" -> ProfileScreen(
                    onLogoutClick = {
                        Log.d("WildWatch", "🔄 Logout button clicked")
                        coroutineScope.launch {
                            Log.d("WildWatch", "🗑️ Clearing authentication token...")
                            TokenManager.clearToken(context)
                            Log.d("WildWatch", "✅ Token cleared successfully")
                            shouldNavigateToLogin = true
                        }
                    }
                )
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
