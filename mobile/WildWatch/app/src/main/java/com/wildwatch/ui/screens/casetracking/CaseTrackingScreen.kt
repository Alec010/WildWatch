package com.wildwatch.ui.screens.casetracking

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
import com.wildwatch.model.IncidentResponse
import com.wildwatch.ui.components.dashboard.StatCard
import com.wildwatch.viewmodel.CaseTrackingViewModel

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

    val statusOptions = listOf("All", "Pending", "In Progress", "Resolved")
    var selectedStatus by remember { mutableStateOf("All") }
    var expanded by remember { mutableStateOf(false) }

    val activities by viewModel.recentActivities.collectAsState()
    val currentPage by viewModel.currentPage.collectAsState()
    val totalPages by viewModel.totalPages.collectAsState()

    val statusFilteredCases = if (selectedStatus == "All") {
        filteredCases
    } else {
        filteredCases.filter { it.status == selectedStatus }
    }

    LaunchedEffect(Unit) {
        viewModel.fetchUserIncidents()
        viewModel.fetchActivities()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Case Tracking", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        containerColor = Color(0xFFF8F8F8)
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
                        // 1️⃣ Status Counts Overview
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

                        // 2️⃣ Status Filter Dropdown
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

                        // 3️⃣ Search Bar
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

                        // 4️⃣ Case List
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

                        // 5️⃣ Recent Activity Section
                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "Recent Activity",
                            style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier
                                .padding(horizontal = 16.dp)
                                .padding(bottom = 8.dp)
                        )

                        activities.forEach { activity ->
                            ActivityCard(activity)
                        }

                        if (totalPages > 1) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Button(
                                    onClick = { viewModel.previousPage() },
                                    enabled = currentPage > 0
                                ) {
                                    Text("Previous")
                                }
                                Text("Page ${currentPage + 1} of $totalPages")
                                Button(
                                    onClick = { viewModel.nextPage() },
                                    enabled = currentPage < totalPages - 1
                                ) {
                                    Text("Next")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ActivityCard(activity: com.wildwatch.model.Activity) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = activity.description,
                style = MaterialTheme.typography.bodyMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Case: ${activity.incident.trackingNumber}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
            Text(
                text = "At: ${activity.createdAt}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
    }
}

@Composable
fun CaseCard(
    incident: IncidentResponse,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = incident.trackingNumber,
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = incident.incidentType,
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Status: ${incident.status ?: "Unknown"}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "Location: ${incident.location}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "Date: ${incident.dateOfIncident} ${incident.timeOfIncident}",
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}
