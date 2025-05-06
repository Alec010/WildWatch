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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import com.wildwatch.ui.theme.WildWatchRed

@Composable
fun NotificationDropdown(
    showDropdown: Boolean,
    onDismiss: () -> Unit,
    notifications: List<NotificationItem> = sampleNotifications,
    onRefresh: () -> Unit = {},
    onMarkAllAsRead: () -> Unit = {},
    onViewAll: () -> Unit = {},
    onNotificationClick: (String) -> Unit = {}
) {
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
                                onClick = onRefresh,
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
                                onClick = onMarkAllAsRead,
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
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 400.dp)
                    ) {
                        items(notifications) { notification ->
                            NotificationItemRow(
                                notification = notification,
                                onClick = { onNotificationClick(notification.id) }
                            )
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
    notification: NotificationItem,
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
                .background(notification.iconBackground),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = notification.icon,
                contentDescription = null,
                tint = notification.iconColor,
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
                    text = notification.title,
                    fontWeight = FontWeight.Medium,
                    fontSize = 14.sp,
                    color = Color(0xFF333333)
                )

                Text(
                    text = notification.timestamp,
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

// Data class for notifications
data class NotificationItem(
    val id: String,
    val title: String,
    val description: String,
    val timestamp: String,
    val isRead: Boolean,
    val icon: ImageVector,
    val iconColor: Color,
    val iconBackground: Color
)

// Sample notifications for preview
val sampleNotifications = listOf(
    NotificationItem(
        id = "1",
        title = "New Report",
        description = "You submitted a new incident report for test6",
        timestamp = "4 days ago",
        isRead = false,
        icon = Icons.Default.Description,
        iconColor = Color.White,
        iconBackground = Color(0xFFE53935) // Red
    ),
    NotificationItem(
        id = "2",
        title = "New Report",
        description = "You submitted a new incident report for test5",
        timestamp = "4 days ago",
        isRead = false,
        icon = Icons.Default.Description,
        iconColor = Color.White,
        iconBackground = Color(0xFFE53935) // Red
    ),
    NotificationItem(
        id = "3",
        title = "New Report",
        description = "You submitted a new incident report for test4",
        timestamp = "5 days ago",
        isRead = true,
        icon = Icons.Default.Description,
        iconColor = Color.White,
        iconBackground = Color(0xFFE53935) // Red
    ),
    NotificationItem(
        id = "4",
        title = "New Report",
        description = "You submitted a new incident report for test6",
        timestamp = "5 days ago",
        isRead = true,
        icon = Icons.Default.Description,
        iconColor = Color.White,
        iconBackground = Color(0xFFE53935) // Red
    ),
    NotificationItem(
        id = "5",
        title = "Case Update",
        description = "Update provided (Updated by: TSG Head)",
        timestamp = "5 days ago",
        isRead = true,
        icon = Icons.Default.Schedule,
        iconColor = Color.White,
        iconBackground = Color(0xFF9C27B0) // Purple
    )
)
