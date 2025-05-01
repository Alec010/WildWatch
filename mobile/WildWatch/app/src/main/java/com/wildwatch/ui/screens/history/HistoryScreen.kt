package com.wildwatch.ui.screens.history

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.model.IncidentResponse
import com.wildwatch.ui.components.ErrorMessage
import com.wildwatch.ui.components.LoadingIndicator
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.HistoryUiState
import com.wildwatch.viewmodel.HistoryViewModel
import com.wildwatch.viewmodel.HistoryViewModelFactory
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

@OptIn(ExperimentalMaterialApi::class, ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    modifier: Modifier = Modifier,
    onIncidentClick: (String) -> Unit = {}
) {
    val context = LocalContext.current
    val viewModel: HistoryViewModel = viewModel(
        factory = HistoryViewModelFactory(context)
    )

    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedStatus by viewModel.selectedStatus.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()

    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = viewModel::refresh
    )

    Scaffold(
    ) { paddingValues ->
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .pullRefresh(pullRefreshState)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Search and Filter Section
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    // Search Bar
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = viewModel::onSearchQueryChanged,
                        placeholder = { Text("Search incidents...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { viewModel.onSearchQueryChanged("") }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear search")
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WildWatchRed,
                            cursorColor = WildWatchRed
                        ),
                        singleLine = true
                    )
                }

                // Stats Section - Use the unfiltered list for counts (but counts are now replaced with icons)
                val allIncidentsForStats = (uiState as? HistoryUiState.Success)?.incidents ?: emptyList()
                // Counts are no longer needed for display, but we can still calculate them if needed for logic
                val allCount = allIncidentsForStats.size
                val resolvedCount = allIncidentsForStats.count { it.status.equals("Resolved", ignoreCase = true) }
                val dismissedCount = allIncidentsForStats.count { it.status.equals("Dismissed", ignoreCase = true) }

                StatsSection(
                    allCount = allCount,
                    resolvedCount = resolvedCount,
                    dismissedCount = dismissedCount,
                    selectedStatus = selectedStatus,
                    onStatusSelected = viewModel::onStatusFilterChanged
                )

                // Content
                when (uiState) {
                    is HistoryUiState.Loading -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            LoadingIndicator()
                        }
                    }
                    is HistoryUiState.Error -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            ErrorMessage(
                                message = (uiState as HistoryUiState.Error).message,
                                onRetry = viewModel::refresh
                            )
                        }
                    }
                    is HistoryUiState.Success -> {
                        val incidents = (uiState as HistoryUiState.Success).incidents

                        if (incidents.isEmpty()) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                EmptyState()
                            }
                        } else {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(incidents) { incident ->
                                    IncidentCard(
                                        incident = incident,
                                        onClick = { onIncidentClick(incident.trackingNumber) }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            PullRefreshIndicator(
                refreshing = isRefreshing,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter),
                backgroundColor = MaterialTheme.colorScheme.surface,
                contentColor = WildWatchRed,
                scale = true
            )
        }
    }
}

@Composable
private fun StatsSection(
    allCount: Int, // Still passed for potential logic, but not displayed
    resolvedCount: Int,
    dismissedCount: Int,
    selectedStatus: String,
    onStatusSelected: (String) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        StatCard(
            icon = Icons.Default.List,
            label = "All Cases",
            color = WildWatchRed,
            isSelected = selectedStatus == "All",
            onClick = { onStatusSelected("All") },
            modifier = Modifier.weight(1f)
        )

        StatCard(
            icon = Icons.Default.CheckCircle,
            label = "Resolved",
            color = Color(0xFF4CAF50),
            isSelected = selectedStatus == "Resolved",
            onClick = { onStatusSelected("Resolved") },
            modifier = Modifier.weight(1f)
        )

        StatCard(
            icon = Icons.Default.Cancel,
            label = "Dismissed",
            color = Color(0xFFF44336),
            isSelected = selectedStatus == "Dismissed",
            onClick = { onStatusSelected("Dismissed") },
            modifier = Modifier.weight(1f)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StatCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector, // Added icon parameter
    label: String,
    color: Color,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) color.copy(alpha = 0.2f) else color.copy(alpha = 0.1f)
        ),
        shape = RoundedCornerShape(12.dp),
        border = if (isSelected) BorderStroke(2.dp, color) else null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(32.dp) // Adjust size as needed
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = color
            )
        }
    }
}

// Rest of the code remains unchanged (IncidentCard, StatusChip, PriorityBadge, EmptyState, etc.)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncidentCard(
    incident: IncidentResponse,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header Row with Case ID and Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Case ID
                Text(
                    text = incident.trackingNumber,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                // Status Chip
                StatusChip(status = incident.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Incident Type with Icon
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(getIncidentTypeColor(incident.incidentType).copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = getIncidentTypeIcon(incident.incidentType),
                        contentDescription = null,
                        tint = getIncidentTypeColor(incident.incidentType),
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = incident.incidentType,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )

                if (incident.priorityLevel != null) {
                    Spacer(modifier = Modifier.width(8.dp))
                    PriorityBadge(priority = incident.priorityLevel)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Location and Date
            Row(
                modifier = Modifier.fillMaxWidth()
            ) {
                // Location
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )

                    Spacer(modifier = Modifier.width(4.dp))

                    Text(
                        text = incident.location,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Date
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarToday,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )

                    Spacer(modifier = Modifier.width(4.dp))

                    Text(
                        text = formatDate(incident.dateOfIncident),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Reporter and Department
            Row(
                modifier = Modifier.fillMaxWidth()
            ) {
                // Reporter
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )

                    Spacer(modifier = Modifier.width(4.dp))

                    Text(
                        text = incident.submittedByFullName ?: incident.submittedBy,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Department
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Business,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )

                    Spacer(modifier = Modifier.width(4.dp))

                    Text(
                        text = incident.officeAdminName ?: "Unassigned",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Action buttons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp),
                horizontalArrangement = Arrangement.End
            ) {
                // View Details
                OutlinedButton(
                    onClick = onClick,
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = WildWatchRed
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = SolidColor(WildWatchRed)
                    ),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Visibility,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("View Details")
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Download Report
                IconButton(
                    onClick = { /* TODO: Download functionality */ },
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Icon(
                        imageVector = Icons.Default.Download,
                        contentDescription = "Download Report",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

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

@Composable
fun EmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.SearchOff,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
            modifier = Modifier.size(64.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "No incidents found",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Try adjusting your search or filters",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
        )
    }
}

@Composable
fun formatDate(dateString: String): String {
    return try {
        val date = LocalDateTime.parse(dateString)
        date.format(DateTimeFormatter.ofPattern("MM/dd/yyyy"))
    } catch (e: DateTimeParseException) {
        try {
            val date = LocalDate.parse(dateString)
            date.format(DateTimeFormatter.ofPattern("MM/dd/yyyy"))
        } catch (e: Exception) {
            dateString
        }
    }
}

@Composable
fun getIncidentTypeIcon(incidentType: String): androidx.compose.ui.graphics.vector.ImageVector {
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
