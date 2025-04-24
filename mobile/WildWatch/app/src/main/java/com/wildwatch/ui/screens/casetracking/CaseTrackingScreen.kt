package com.wildwatch.ui.screens.casetracking

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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wildwatch.model.IncidentResponse
import com.wildwatch.viewmodel.CaseTrackingViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseTrackingScreen(
    viewModel: CaseTrackingViewModel,
    onBackClick: () -> Unit = {},
    onCaseClick: (String) -> Unit = {}
) {
    val cases by viewModel.cases.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()

    // Fetch incidents on screen load
    LaunchedEffect(Unit) {
        viewModel.fetchUserIncidents()
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
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(cases) { incident ->
                            CaseCard(incident = incident, onClick = { onCaseClick(incident.id) })
                        }
                    }
                }
            }
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
