package com.wildwatch.navigation

import androidx.compose.ui.graphics.vector.ImageVector

/**
 * Data class representing an item in the bottom navigation bar
 */
data class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector,
    val isFab: Boolean = false
)

