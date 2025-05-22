package com.wildwatch.ui.screens.casetracking

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.wildwatch.model.Activity
import com.wildwatch.model.IncidentResponse
import com.wildwatch.ui.components.dashboard.StatCard
import com.wildwatch.viewmodel.CaseTrackingViewModel
import com.wildwatch.ui.components.casetracking.ActivityCard
import com.wildwatch.ui.components.casetracking.CaseCard
import com.wildwatch.navigation.Screen
import kotlinx.coroutines.delay
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.animateColorAsState
import androidx.compose.ui.draw.scale

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

    var selectedPriority by remember { mutableStateOf("All") }
    var selectedTab by remember { mutableStateOf(0) }
    var selectedStatus by remember { mutableStateOf("All") }

    val priorities = listOf("All", "High", "Medium", "Low")

    val activities by viewModel.recentActivities.collectAsState()
    val currentPage by viewModel.currentPage.collectAsState()
    val totalPages by viewModel.totalPages.collectAsState()

    val statusOptions = listOf(
        Pair("Pending", pendingCount),
        Pair("In Progress", inProgressCount),
        Pair("All", pendingCount + inProgressCount + resolvedCount)
    )

    // Combine status and priority filters (robust against nulls)
    val combinedFilteredCases = filteredCases.filter { incident ->
        (selectedStatus == "All" || (incident.status?.equals(selectedStatus, ignoreCase = true) == true)) &&
        (selectedPriority == "All" || (incident.priorityLevel?.equals(selectedPriority, ignoreCase = true) == true))
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
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Case Tracking",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFB71C1C)
                        )
                        Text(
                            text = "Track the status of your incident reports.",
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
                            .padding(16.dp)
                    ) {
                        // Search Bar
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { viewModel.updateSearchQuery(it) },
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

                        // Priority Filters
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            priorities.forEach { priority ->
                                val isSelected = selectedPriority == priority
                                val backgroundColor = if (isSelected) Color.Black else Color.White
                                val textColor = if (isSelected) Color.White else Color.Black

                                Surface(
                                    modifier = Modifier
                                        .clickable { selectedPriority = priority },
                                    shape = RoundedCornerShape(8.dp),
                                    color = backgroundColor
                                ) {
                                    Text(
                                        text = priority,
                                        color = textColor,
                                        modifier = Modifier
                                            .padding(horizontal = 16.dp, vertical = 8.dp)
                                    )
                                }
                            }
                        }

                        // Status Cards
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            statusOptions.forEach { (title, count) ->
                                val isSelected = selectedStatus == title
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
                                        .clickable { selectedStatus = title }
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
                                            color = Color(0xFFB71C1C)
                                        )
                                        Text(
                                            text = if (title == "All") "All Cases" else title,
                                            fontSize = 12.sp,
                                            color = Color(0xFF374151)
                                        )
                                    }
                                }
                            }
                        }

                        // Tabs
                        val tabs = listOf("My Cases", "Recent Activity")

                        // Enhanced Tab UI
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp)
                        ) {
                            // Custom tab background
                            Surface(
                                color = Color(0xFFF3F4F6),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(4.dp),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    tabs.forEachIndexed { index, title ->
                                        val isSelected = selectedTab == index
                                        Surface(
                                            shape = RoundedCornerShape(8.dp),
                                            color = if (isSelected) Color.White else Color.Transparent,
                                            modifier = Modifier
                                                .weight(1f)
                                                .padding(4.dp)
                                                .clickable { selectedTab = index }
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .padding(vertical = 12.dp, horizontal = 8.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = title,
                                                    style = MaterialTheme.typography.labelLarge,
                                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                                    color = if (isSelected) Color(0xFFB71C1C) else Color.Gray
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Tab Content
                        when (selectedTab) {
                            0 -> {
                                if (combinedFilteredCases.isEmpty()) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(16.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "No cases found matching your criteria",
                                            color = Color.Gray,
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                } else {
                                    LazyColumn(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(vertical = 8.dp),
                                        verticalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        items(combinedFilteredCases) { incident ->
                                            CaseCard(
                                                incident = incident,
                                                onClick = {
                                                    navController.navigate(
                                                        Screen.CaseDetails.createRoute(incident.id)
                                                    )
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                            1 -> {
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
                                                color = Color.Gray,
                                                textAlign = TextAlign.Center
                                            )
                                        }
                                    }
                                    else -> {
                                        LazyColumn(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .padding(vertical = 8.dp),
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

