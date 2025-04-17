package com.wildwatch.ui.components.bottomnav

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.wildwatch.navigation.BottomNavItem
import com.wildwatch.ui.theme.WildWatchTheme

@Preview(showBackground = true)
@Composable
fun WildWatchBottomNavigationPreview() {
    val items = listOf(
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

    WildWatchTheme {
        WildWatchBottomNavigation(
            items = items,
            selectedItemRoute = "dashboard",
            onItemSelected = {}
        )
    }
}

