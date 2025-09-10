package com.wildwatch.ui.screens.history

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.ui.components.ErrorMessage
import com.wildwatch.ui.components.LoadingIndicator
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.HistoryUiState
import com.wildwatch.viewmodel.HistoryViewModel
import com.wildwatch.viewmodel.HistoryViewModelFactory
import com.wildwatch.ui.components.history.IncidentCard
import com.wildwatch.ui.components.history.IncidentSummaryStatsRow
import com.wildwatch.ui.components.history.IncidentSearchBar
import com.wildwatch.ui.components.history.IncidentFilterChips
import com.wildwatch.ui.components.history.IncidentList

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
    
    // Get counts from ViewModel
    val allCount by viewModel.allCount.collectAsState()
    val resolvedCount by viewModel.resolvedCount.collectAsState()
    val dismissedCount by viewModel.dismissedCount.collectAsState()

    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = viewModel::refresh
    )

    // Get all incidents for counting
    val allIncidents = when (uiState) {
        is HistoryUiState.Success -> (uiState as HistoryUiState.Success).incidents
        else -> emptyList()
    }

    // Get filtered incidents for display
    val filteredIncidents = when (uiState) {
        is HistoryUiState.Success -> {
            val incidents = (uiState as HistoryUiState.Success).incidents
            val searchFiltered = if (searchQuery.isBlank()) incidents
            else incidents.filter { incident ->
                incident.trackingNumber?.contains(searchQuery, ignoreCase = true) == true ||
                incident.description?.contains(searchQuery, ignoreCase = true) == true
            }
            
            // Apply status filter
            when (selectedStatus) {
                "Resolved" -> searchFiltered.filter { it.status.equals("Resolved", ignoreCase = true) }
                "Dismissed" -> searchFiltered.filter { it.status.equals("Dismissed", ignoreCase = true) }
                else -> searchFiltered
            }
        }
        else -> emptyList()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "History",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = WildWatchRed
                        )
                        Text(
                            text = "View and manage your incident history.",
                            fontSize = 14.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 2.dp)
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
            modifier = modifier
                .fillMaxSize()
                .background(Color(0xFFF5F5F5))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp)
                    .pullRefresh(pullRefreshState)
            ) {
                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = viewModel::onSearchQueryChanged,
                    placeholder = { Text("Search incidents...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White
                    ),
                    singleLine = true,
                    shape = RoundedCornerShape(24.dp)
                )

                // Status Cards
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val statusOptions = listOf(
                        Triple("All", allCount, "All Cases"),
                        Triple("Resolved", resolvedCount, "Resolved"),
                        Triple("Dismissed", dismissedCount, "Dismissed")
                    )

                    statusOptions.forEach { (status, count, title) ->
                        val isSelected = selectedStatus == status
                        val backgroundColor by animateColorAsState(
                            if (isSelected) Color(0xFFF3F4F6) else Color.White,
                            label = "cardBgColor"
                        )
                        val scale by animateFloatAsState(
                            if (isSelected) 1.05f else 1f,
                            label = "cardScale"
                        )

                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { viewModel.onStatusFilterChanged(status) }
                                .scale(scale),
                            colors = CardDefaults.cardColors(
                                containerColor = backgroundColor
                            ),
                            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = count.toString(),
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = WildWatchRed
                                )
                                Text(
                                    text = title,
                                    fontSize = 12.sp,
                                    color = Color(0xFF374151)
                                )
                            }
                        }
                    }
                }

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
                                contentPadding = PaddingValues(vertical = 8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(incidents) { incident ->
                                    IncidentCard(
                                        incident = incident,
                                        onViewDetailsClick = onIncidentClick
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
