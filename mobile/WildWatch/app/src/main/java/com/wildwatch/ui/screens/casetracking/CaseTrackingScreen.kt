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
import com.wildwatch.model.Activity
import com.wildwatch.model.IncidentResponse
import com.wildwatch.ui.components.dashboard.StatCard
import com.wildwatch.viewmodel.CaseTrackingViewModel
import com.wildwatch.ui.components.casetracking.ActivityCard
import com.wildwatch.ui.components.casetracking.CaseCard
import kotlinx.coroutines.delay


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseTrackingScreen(
    viewModel: CaseTrackingViewModel,
    onBackClick: () -> Unit = {},
    onCaseClick: (String) -> Unit = {}
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
                    Column(modifier = Modifier.fillMaxSize()) {
                        // 1️⃣ Tabs for "All Cases" and "Recent Activity"
                        var selectedTab by remember { mutableStateOf(0) } // 0 = "All Cases", 1 = "Recent Activity"
                        TabRow(selectedTabIndex = selectedTab) {
                            Tab(
                                selected = selectedTab == 0,
                                onClick = { selectedTab = 0 },
                                text = { Text("All Cases", color = if (selectedTab == 0) Color.Red else Color.Black) }
                            )
                            Tab(
                                selected = selectedTab == 1,
                                onClick = { selectedTab = 1 },
                                text = { Text("Recent Activity", color = if (selectedTab == 1) Color.Red else Color.Black) }
                            )
                        }

                        // 2️⃣ Conditional Rendering based on Selected Tab
                        when (selectedTab) {
                            0 -> {
                                // All Cases Tab
                                Spacer(modifier = Modifier.height(16.dp))

                                // 3️⃣ Status Counts Overview
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                                ) {
                                    StatCard(
                                        title = "Pending",
                                        count = pendingCount,
                                        icon = Icons.Default.Pending,
                                        iconTint = Color(0xFFFFC107),
                                        modifier = Modifier.weight(1f)
                                    )
                                    StatCard(
                                        title = "In Progress",
                                        count = inProgressCount,
                                        icon = Icons.Default.Schedule,
                                        iconTint = Color(0xFF2196F3),
                                        modifier = Modifier.weight(1f)
                                    )
                                    StatCard(
                                        title = "Resolved",
                                        count = resolvedCount,
                                        icon = Icons.Default.CheckCircle,
                                        iconTint = Color(0xFF4CAF50),
                                        modifier = Modifier.weight(1f)
                                    )
                                }

                                // 4️⃣ Status Filter Dropdown
                                Box(modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp)
                                ) {
                                    OutlinedTextField(
                                        value = selectedStatus,
                                        onValueChange = {},
                                        label = { Text("Filter by Status") },
                                        readOnly = true,
                                        modifier = Modifier.fillMaxWidth(),
                                        trailingIcon = {
                                            IconButton(onClick = { expanded = !expanded }) {
                                                Icon(
                                                    imageVector = Icons.Default.ArrowDropDown,
                                                    contentDescription = "Dropdown"
                                                )
                                            }
                                        }
                                    )

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

                                // 5️⃣ Search Bar
                                OutlinedTextField(
                                    value = searchQuery,
                                    onValueChange = { viewModel.onSearchQueryChanged(it) },
                                    label = { Text("Search by Case ID, Type, or Location") },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 8.dp),
                                    singleLine = true,
                                    leadingIcon = {
                                        Icon(Icons.Default.Search, contentDescription = "Search")
                                    }
                                )

                                // 6️⃣ Case List
                                if (statusFilteredCases.isEmpty()) {
                                    Box(
                                        modifier = Modifier.fillMaxSize(),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("No cases found for the current filter.", color = Color.Gray)
                                    }
                                } else {
                                    LazyColumn(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(horizontal = 16.dp, vertical = 8.dp),
                                        verticalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        items(statusFilteredCases) { incident ->
                                            CaseCard(incident = incident, onClick = { onCaseClick(incident.id) })
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
                                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                            CircularProgressIndicator()
                                        }
                                    }
                                    activitiesError != null -> {
                                        Column(
                                            modifier = Modifier.fillMaxSize(),
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.Center
                                        ) {
                                            Text(activitiesError!!, color = MaterialTheme.colorScheme.error)
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Button(onClick = { viewModel.fetchActivities() }) {
                                                Text("Retry")
                                            }
                                        }
                                    }
                                    activities.isEmpty() -> {
                                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                            Text("No recent activities found", color = Color.Gray)
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

