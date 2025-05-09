package com.wildwatch.ui.screens.casetracking

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.wildwatch.model.Activity
import com.wildwatch.model.IncidentResponse
import com.wildwatch.ui.components.dashboard.StatCard
import com.wildwatch.viewmodel.CaseTrackingViewModel
import com.wildwatch.ui.components.casetracking.ActivityCard
import com.wildwatch.ui.components.casetracking.CaseCard
import com.wildwatch.navigation.Screen
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseTrackingScreen(
    viewModel: CaseTrackingViewModel,
    navController: NavController,
    onBackClick: () -> Unit = {}
) {
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    val filteredCases by viewModel.filteredCases.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val pendingCount by viewModel.pendingCount.collectAsState()
    val inProgressCount by viewModel.inProgressCount.collectAsState()
    val resolvedCount by viewModel.resolvedCount.collectAsState()

    // Status filter dropdown
    val statusOptions = listOf("All", "Pending", "In Progress", "Resolved")
    var selectedStatus by remember { mutableStateOf("All") }
    var expanded by remember { mutableStateOf(false) }

    val activities by viewModel.recentActivities.collectAsState()
    val currentPage by viewModel.currentPage.collectAsState()
    val totalPages by viewModel.totalPages.collectAsState()

    // Filtering logic
    val statusFilteredCases = if (selectedStatus == "All") {
        filteredCases
    } else {
        filteredCases.filter { it.status == selectedStatus }
    }

    // Fetch incidents and activities when screen loads
    LaunchedEffect(Unit) {
        viewModel.fetchUserIncidents()
        viewModel.fetchActivities()
    }

    // Add periodic refresh of activities
    LaunchedEffect(Unit) {
        while (true) {
            delay(30000) // Refresh every 30 seconds
            viewModel.fetchActivities()
        }
    }

    Scaffold(
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            when {
                loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Error: $error", color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { viewModel.fetchUserIncidents() }) {
                            Text("Retry")
                        }
                    }
                }
                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFFF5F5F5))
                    ) {
                        // Stats Section
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            StatCard(
                                title = "Pending",
                                count = pendingCount,
                                icon = Icons.Default.Schedule,
                                iconTint = Color(0xFFFFA000)
                            )
                            StatCard(
                                title = "In Progress",
                                count = inProgressCount,
                                icon = Icons.Default.Pending,
                                iconTint = Color(0xFF2196F3)
                            )
                            StatCard(
                                title = "Resolved",
                                count = resolvedCount,
                                icon = Icons.Default.CheckCircle,
                                iconTint = Color(0xFF4CAF50)
                            )
                        }

                        // Search and Filter Section
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { viewModel.updateSearchQuery(it) },
                                placeholder = { Text("Search cases...") },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                leadingIcon = {
                                    Icon(
                                        Icons.Default.Search,
                                        contentDescription = "Search"
                                    )
                                }
                            )

                            Spacer(modifier = Modifier.width(8.dp))

                            Box {
                                OutlinedButton(
                                    onClick = { expanded = true },
                                    modifier = Modifier.width(120.dp)
                                ) {
                                    Text(selectedStatus)
                                    Icon(
                                        Icons.Default.ArrowDropDown,
                                        contentDescription = "Filter"
                                    )
                                }

                                DropdownMenu(
                                    expanded = expanded,
                                    onDismissRequest = { expanded = false }
                                ) {
                                    statusOptions.forEach { status ->
                                        DropdownMenuItem(
                                            text = { Text(status) },
                                            onClick = {
                                                selectedStatus = status
                                                expanded = false
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        // Tab Section
                        var selectedTab by remember { mutableStateOf(0) }
                        val tabs = listOf("My Cases", "Recent Activity")

                        TabRow(
                            selectedTabIndex = selectedTab,
                            containerColor = Color.White,
                            contentColor = MaterialTheme.colorScheme.primary
                        ) {
                            tabs.forEachIndexed { index, title ->
                                Tab(
                                    selected = selectedTab == index,
                                    onClick = { selectedTab = index },
                                    text = { Text(title) }
                                )
                            }
                        }

                        // Content based on selected tab
                        when (selectedTab) {
                            0 -> {
                                if (statusFilteredCases.isEmpty()) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(16.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "No cases found",
                                            style = MaterialTheme.typography.bodyLarge,
                                            color = Color.Gray
                                        )
                                    }
                                } else {
                                    LazyColumn(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(horizontal = 16.dp, vertical = 8.dp),
                                        verticalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        items(statusFilteredCases) { incident ->
                                            CaseCard(
                                                incident = incident,
                                                onClick = {
                                                    navController.navigate(
                                                        Screen.CaseDetails.createRoute(incident.trackingNumber)
                                                    )
                                                }
                                            )
                                        }
                                    }
                                }
                            }

                            1 -> {
                                // Recent Activity Tab
                                Spacer(modifier = Modifier.height(16.dp))

                                val activitiesLoading by viewModel.activitiesLoading.collectAsState()
                                val activitiesError by viewModel.activitiesError.collectAsState()

                                when {
                                    activitiesLoading -> {
                                        Box(
                                            modifier = Modifier.fillMaxSize(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            CircularProgressIndicator()
                                        }
                                    }
                                    activitiesError != null -> {
                                        Box(
                                            modifier = Modifier.fillMaxSize(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(
                                                horizontalAlignment = Alignment.CenterHorizontally
                                            ) {
                                                Text(
                                                    text = "Error: $activitiesError",
                                                    color = MaterialTheme.colorScheme.error
                                                )
                                                Spacer(modifier = Modifier.height(8.dp))
                                                Button(
                                                    onClick = { viewModel.fetchActivities() }
                                                ) {
                                                    Text("Retry")
                                                }
                                            }
                                        }
                                    }
                                    activities.isEmpty() -> {
                                        Box(
                                            modifier = Modifier.fillMaxSize(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "No recent activity",
                                                style = MaterialTheme.typography.bodyLarge,
                                                color = Color.Gray
                                            )
                                        }
                                    }
                                    else -> {
                                        LazyColumn(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .padding(horizontal = 16.dp, vertical = 8.dp),
                                            verticalArrangement = Arrangement.spacedBy(12.dp)
                                        ) {
                                            items(activities) { activity ->
                                                ActivityCard(activity)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

