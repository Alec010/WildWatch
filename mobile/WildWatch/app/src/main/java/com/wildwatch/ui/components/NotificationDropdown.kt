package com.wildwatch.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.model.ActivityLog
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.NotificationViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun NotificationDropdown(
    showDropdown: Boolean,
    onDismiss: () -> Unit,
    onViewAll: () -> Unit = {},
    onNotificationClick: (ActivityLog) -> Unit = {}
) {
    val context = LocalContext.current
    val viewModel: NotificationViewModel = viewModel(
        factory = NotificationViewModel.Factory(context)
    )

    val notifications by viewModel.notifications.collectAsState()
    val unreadCount by viewModel.unreadCount.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    if (showDropdown) {
        Popup(
            onDismissRequest = onDismiss,
            properties = PopupProperties(
                focusable = true,
                dismissOnBackPress = true,
                dismissOnClickOutside = true
            )
        ) {
            Card(
                modifier = Modifier
                    .width(320.dp)
                    .padding(8.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color.White
                ),
                elevation = CardDefaults.cardElevation(
                    defaultElevation = 4.dp
                )
            ) {
                Column {
                    // Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Notifications",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 16.sp
                        )

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            IconButton(
                                onClick = { viewModel.fetchNotifications() },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Refresh,
                                    contentDescription = "Refresh",
                                    tint = Color.Gray,
                                    modifier = Modifier.size(18.dp)
                                )
                            }

                            TextButton(
                                onClick = { viewModel.markAllAsRead() },
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "Mark all as read",
                                    color = Color.Gray,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }

                    HorizontalDivider(color = Color(0xFFEEEEEE))

                    // Notifications List
                    if (isLoading) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = WildWatchRed)
                        }
                    } else if (error != null) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = error ?: "An error occurred",
                                color = WildWatchRed,
                                fontSize = 14.sp
                            )
                        }
                    } else if (notifications.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No notifications",
                                color = Color.Gray,
                                fontSize = 14.sp
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 400.dp)
                        ) {
                            items(notifications) { notification ->
                                NotificationItemRow(
                                    notification = notification,
                                    onClick = {
                                        viewModel.markAsRead(notification.id)
                                        onNotificationClick(notification)
                                    }
                                )
                            }
                        }
                    }

                    // Footer
                    HorizontalDivider(color = Color(0xFFEEEEEE))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(onClick = onViewAll)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "View All Notifications",
                            color = WildWatchRed,
                            fontWeight = FontWeight.Medium,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationItemRow(
    notification: ActivityLog,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(if (!notification.isRead) Color(0xFFF8F8F8) else Color.Transparent)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Icon
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(getIconBackground(notification.activityType)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = getIcon(notification.activityType),
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(20.dp)
            )
        }

        // Content
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formatActivityType(notification.activityType),
                    fontWeight = FontWeight.Medium,
                    fontSize = 14.sp,
                    color = Color(0xFF333333)
                )

                Text(
                    text = formatTimestamp(notification.createdAt),
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }

            Text(
                text = notification.description,
                fontSize = 13.sp,
                color = Color(0xFF666666),
                lineHeight = 18.sp
            )
        }
    }
}

private fun getIcon(activityType: String): ImageVector {
    return when (activityType) {
        "STATUS_CHANGE" -> Icons.Default.Schedule
        "UPDATE" -> Icons.Default.Info
        "NEW_REPORT" -> Icons.Default.Description
        "CASE_RESOLVED" -> Icons.Default.CheckCircle
        "VERIFICATION" -> Icons.Default.Verified
        else -> Icons.Default.Notifications
    }
}

private fun getIconBackground(activityType: String): Color {
    return when (activityType) {
        "STATUS_CHANGE" -> Color(0xFF1976D2) // Blue
        "UPDATE" -> Color(0xFF9C27B0) // Purple
        "NEW_REPORT" -> Color(0xFFE53935) // Red
        "CASE_RESOLVED" -> Color(0xFF4CAF50) // Green
        "VERIFICATION" -> Color(0xFF4CAF50) // Green
        else -> Color(0xFF757575) // Gray
    }
}

private fun formatActivityType(type: String): String {
    return when (type) {
        "STATUS_CHANGE" -> "Status Update"
        "UPDATE" -> "Case Update"
        "NEW_REPORT" -> "New Report"
        "CASE_RESOLVED" -> "Case Resolved"
        "VERIFICATION" -> "Case Verified"
        else -> type.replace("_", " ").lowercase().replaceFirstChar { it.uppercase() }
    }
}

private fun formatTimestamp(date: Date): String {
    val now = Date()
    val diff = now.time - date.time
    
    return when {
        diff < 60000 -> "Just now"
        diff < 3600000 -> "${diff / 60000}m ago"
        diff < 86400000 -> "${diff / 3600000}h ago"
        diff < 604800000 -> "${diff / 86400000}d ago"
        else -> SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(date)
    }
}
