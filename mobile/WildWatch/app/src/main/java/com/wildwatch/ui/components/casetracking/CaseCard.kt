package com.wildwatch.ui.components.casetracking

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wildwatch.model.IncidentResponse

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