package com.wildwatch.ui.screens.notification

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.wildwatch.model.ActivityLog
import com.wildwatch.navigation.Screen
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.NotificationViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ViewAllNotificationScreen(
    navController: NavController,
    onBackClick: () -> Unit = {}
) {
    val context = LocalContext.current
    val viewModel: NotificationViewModel = viewModel(
        factory = NotificationViewModel.Factory(context)
    )
    val notifications by viewModel.notifications.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Notifications",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { onBackClick() }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = WildWatchRed)
                    }
                }
                error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = error ?: "An error occurred",
                            color = WildWatchRed,
                            fontSize = 16.sp
                        )
                    }
                }
                notifications.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No notifications",
                            color = Color.Gray,
                            fontSize = 16.sp
                        )
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(notifications) { notification ->
                            NotificationListItem(
                                notification = notification,
                                onClick = {
                                    viewModel.markAsRead(notification.id)
                                    notification.incident?.id?.let { incidentId ->
                                        navController.navigate(Screen.CaseDetails.createRoute(incidentId))
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationListItem(
    notification: ActivityLog,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (!notification.isRead) Color(0xFFF8F8F8) else Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formatActivityType(notification.activityType),
                    fontWeight = FontWeight.Medium,
                    fontSize = 15.sp,
                    color = Color(0xFF333333)
                )
                Text(
                    text = formatTimestamp(notification.createdAt),
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = notification.description,
                fontSize = 14.sp,
                color = Color(0xFF666666),
                lineHeight = 18.sp
            )
        }
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