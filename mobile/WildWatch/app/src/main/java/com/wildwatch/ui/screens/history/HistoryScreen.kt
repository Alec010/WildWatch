package com.wildwatch.ui.screens.history

import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.ui.components.ErrorMessage
import com.wildwatch.ui.components.LoadingIndicator
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.HistoryUiState
import com.wildwatch.viewmodel.HistoryViewModel
import com.wildwatch.viewmodel.HistoryViewModelFactory
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
                // Search Bar
                IncidentSearchBar(
                    query = searchQuery,
                    onQueryChange = viewModel::onSearchQueryChanged
                )

                // Status Filter
                IncidentFilterChips(
                    filters = listOf("All", "Resolved", "Dismissed"),
                    selected = selectedStatus,
                    onFilterSelected = viewModel::onStatusFilterChanged
                )

                // Summary Stats
                val allIncidentsForStats = (uiState as? HistoryUiState.Success)?.incidents ?: emptyList()
                val allCount = allIncidentsForStats.size
                val resolvedCount = allIncidentsForStats.count { it.status.equals("Resolved", ignoreCase = true) }
                val dismissedCount = allIncidentsForStats.count { it.status.equals("Dismissed", ignoreCase = true) }

                IncidentSummaryStatsRow(
                    allCount = allCount,
                    resolvedCount = resolvedCount,
                    dismissedCount = dismissedCount
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
                            IncidentList(
                                incidents = incidents,
                                onIncidentClick = onIncidentClick
                            )
                            // Optionally add IncidentLoadMoreButton if you have pagination
                            // IncidentLoadMoreButton(onClick = viewModel::loadMore)
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
