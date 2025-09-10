package com.wildwatch.ui.screens.casetracking

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
import androidx.compose.material.icons.outlined.Sort
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.wildwatch.model.IncidentResponse
import com.wildwatch.navigation.Screen
import com.wildwatch.ui.components.ErrorMessage
import com.wildwatch.ui.components.LoadingIndicator
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.CaseTrackingViewModel
import com.wildwatch.viewmodel.CaseTrackingViewModelFactory
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.platform.LocalContext
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ViewAllCasesScreen(
    navController: NavController,
    onBackClick: () -> Unit = {}
) {
    val context = LocalContext.current
    val viewModel: CaseTrackingViewModel = viewModel(
        factory = CaseTrackingViewModelFactory(context)
    )

    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    val filteredCases by viewModel.filteredCases.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedStatus by viewModel.selectedStatus.collectAsState()

    var showStatusMenu by remember { mutableStateOf(false) }
    val statusOptions = listOf("All", "Pending", "In Progress", "Resolved", "Dismissed")

    // Fetch incidents when screen loads
    LaunchedEffect(Unit) {
        viewModel.fetchUserIncidents()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "All Cases",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = WildWatchRed
                        )
                        Text(
                            text = "View and manage all incident reports",
                            fontSize = 14.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = WildWatchRed
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF5F5F5))
                .padding(horizontal = 16.dp)
        ) {
            // Search and Filter Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Refresh Button
                IconButton(
                    onClick = { viewModel.fetchUserIncidents() },
                    modifier = Modifier
                        .size(56.dp)
                        .background(
                            color = Color.White,
                            shape = CircleShape
                        )
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Refresh,
                        contentDescription = "Refresh",
                        tint = WildWatchRed,
                        modifier = Modifier.size(24.dp)
                    )
                }
                
                // Search Field
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = viewModel::onSearchQueryChanged,
                    placeholder = { Text("Search incidents...") },
                    leadingIcon = { 
                        Icon(
                            imageVector = Icons.Default.Search, 
                            contentDescription = "Search",
                            tint = Color.Gray
                        ) 
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        focusedBorderColor = Color.LightGray,
                        unfocusedBorderColor = Color.LightGray
                    ),
                    singleLine = true,
                    shape = RoundedCornerShape(8.dp)
                )
                
                // Filter Button
                IconButton(
                    onClick = { showStatusMenu = !showStatusMenu },
                ) {
                    Icon(
                        imageVector = Icons.Default.FilterList,
                        contentDescription = "Filter",
                        tint = WildWatchRed,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            // Status Dropdown Menu
            Box {
                DropdownMenu(
                    expanded = showStatusMenu,
                    onDismissRequest = { showStatusMenu = false },
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                ) {
                    statusOptions.forEach { status ->
                        DropdownMenuItem(
                            text = { Text(status) },
                            onClick = {
                                viewModel.updateSelectedStatus(status)
                                showStatusMenu = false
                            }
                        )
                    }
                }
            }

            // Cases List
            when {
                loading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        LoadingIndicator()
                    }
                }
                error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        ErrorMessage(
                            message = error ?: "Unknown error",
                            onRetry = { viewModel.fetchUserIncidents() }
                        )
                    }
                }
                filteredCases.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.SearchOff,
                                contentDescription = null,
                                tint = Color.Gray,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "No incidents found",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.Gray
                            )
                        }
                    }
                }
                else -> {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        items(filteredCases) { incident ->
                            IncidentCard(
                                incident = incident,
                                onClick = {
                                    navController.navigate(
                                        Screen.CaseDetails.createRoute(incident.id ?: "")
                                    )
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
fun IncidentCard(
    incident: IncidentResponse,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Title
            Text(
                text = incident.incidentType ?: "Unknown Incident",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = Color.DarkGray
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Date and Time
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.AccessTime,
                    contentDescription = null,
                    tint = Color.Gray,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = formatDateTime(incident.dateOfIncident ?: ""),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Location
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = Color.Gray,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = incident.location ?: "Unknown Location",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Description (if available)
            if (!incident.description.isNullOrBlank()) {
                Text(
                    text = incident.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.DarkGray,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
            
            // Status Chip
            Box(modifier = Modifier.fillMaxWidth()) {
                StatusChip(status = incident.status ?: "Pending")
            }
        }
    }
}

@Composable
fun StatusChip(status: String) {
    val (backgroundColor, textColor) = when (status.lowercase()) {
        "resolved" -> Color(0xFFD4EDDA) to Color(0xFF155724)
        "in progress" -> Color(0xFFCCE5FF) to Color(0xFF004085)
        "assigned" -> Color(0xFFD1E7DD) to Color(0xFF0F5132)
        "pending" -> Color(0xFFFFF3CD) to Color(0xFF856404)
        "dismissed" -> Color(0xFFF8D7DA) to Color(0xFF721C24)
        else -> Color(0xFFE2E3E5) to Color(0xFF383D41)
    }

    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(4.dp)
    ) {
        Text(
            text = status.uppercase(),
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Medium,
            color = textColor
        )
    }
}

// Helper function to format date string
fun formatDateTime(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())
        val date = inputFormat.parse(dateString)
        date?.let { outputFormat.format(it) } ?: dateString
    } catch (e: Exception) {
        try {
            // Try alternative format
            val altInputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val outputFormat = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())
            val date = altInputFormat.parse(dateString)
            date?.let { outputFormat.format(it) } ?: dateString
        } catch (e: Exception) {
            dateString
        }
    }
} 