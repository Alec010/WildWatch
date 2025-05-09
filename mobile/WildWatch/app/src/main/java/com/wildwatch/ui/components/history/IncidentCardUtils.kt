package com.wildwatch.ui.components.history

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.MoneyOff
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Report
import androidx.compose.ui.graphics.vector.ImageVector

@Composable
fun StatusChip(status: String) {
    val (backgroundColor, textColor) = when (status.lowercase()) {
        "resolved" -> Pair(Color(0xFF4CAF50).copy(alpha = 0.1f), Color(0xFF4CAF50))
        "dismissed" -> Pair(Color(0xFFF44336).copy(alpha = 0.1f), Color(0xFFF44336))
        "pending" -> Pair(Color(0xFFFFA000).copy(alpha = 0.1f), Color(0xFFFFA000))
        "in progress" -> Pair(Color(0xFF2196F3).copy(alpha = 0.1f), Color(0xFF2196F3))
        else -> Pair(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant)
    }
    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(16.dp)
    ) {
        Text(
            text = status,
            style = MaterialTheme.typography.bodySmall,
            color = textColor,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun PriorityBadge(priority: String) {
    val (backgroundColor, textColor) = when (priority.uppercase()) {
        "HIGH" -> Pair(Color(0xFFF44336).copy(alpha = 0.1f), Color(0xFFF44336))
        "MEDIUM" -> Pair(Color(0xFFFFA000).copy(alpha = 0.1f), Color(0xFFFFA000))
        "LOW" -> Pair(Color(0xFF4CAF50).copy(alpha = 0.1f), Color(0xFF4CAF50))
        else -> Pair(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant)
    }
    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(4.dp)
    ) {
        Text(
            text = priority,
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

fun getIncidentTypeIcon(incidentType: String): ImageVector {
    return when (incidentType.lowercase()) {
        "suspicious activity" -> Icons.Default.Visibility
        "theft" -> Icons.Default.MoneyOff
        "vandalism" -> Icons.Default.Build
        "harassment" -> Icons.Default.Warning
        else -> Icons.Default.Report
    }
}

@Composable
fun getIncidentTypeColor(incidentType: String): Color {
    return when (incidentType.lowercase()) {
        "suspicious activity" -> Color(0xFFF44336) // Red
        "theft" -> Color(0xFF9C27B0) // Purple
        "vandalism" -> Color(0xFF2196F3) // Blue
        "harassment" -> Color(0xFFFFA000) // Amber
        else -> MaterialTheme.colorScheme.primary
    }
} 