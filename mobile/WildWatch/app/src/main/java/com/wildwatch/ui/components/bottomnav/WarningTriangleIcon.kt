package com.wildwatch.ui.components.bottomnav

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun WarningTriangleIcon(
    modifier: Modifier = Modifier,
    color: Color = Color.Red
) {
    // Use the built-in warning icon from Material Icons
    Icon(
        imageVector = Icons.Filled.Warning,  // Warning icon
        contentDescription = "Warning Icon",
        tint = color,                       // Set the icon color
        modifier = modifier.size(24.dp)     // Set the size of the icon
    )
}
