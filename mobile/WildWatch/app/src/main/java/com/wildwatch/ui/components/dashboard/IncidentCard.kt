package com.wildwatch.ui.components.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.ui.theme.*

enum class IncidentStatus {
    IN_PROGRESS, ASSIGNED, RESOLVED, URGENT
}

data class IncidentInfo(
    val title: String,
    val location: String,
    val locationDetail: String,
    val description: String,
    val status: IncidentStatus,
    val timestamp: String
)

@Composable
fun IncidentCard(
    incident: IncidentInfo,
    onViewDetailsClick: () -> Unit = {}
) {
    val (borderColor, statusColor, statusText) = when (incident.status) {
        IncidentStatus.IN_PROGRESS -> Triple(InProgressYellow, InProgressYellow, "In Progress")
        IncidentStatus.ASSIGNED -> Triple(AssignedPurple, AssignedPurple, "Assigned")
        IncidentStatus.RESOLVED -> Triple(ResolvedGreen, ResolvedGreen, "Resolved")
        IncidentStatus.URGENT -> Triple(UrgentRed, UrgentRed, "Urgent")
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = CardBackground
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 1.dp
        )
    ) {
        Row(modifier = Modifier.fillMaxWidth()) {
            // Left border indicator
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(IntrinsicSize.Min)
                    .background(borderColor)
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = incident.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = incident.timestamp,
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

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
                        text = "${incident.location} - ${incident.locationDetail}",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = incident.description,
                    fontSize = 14.sp,
                    color = Color.DarkGray,
                    lineHeight = 20.sp
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = statusColor.copy(alpha = 0.1f)
                    ) {
                        Text(
                            text = statusText,
                            color = statusColor,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }

                    TextButton(onClick = onViewDetailsClick) {
                        Text(
                            text = "View Details",
                            color = Color.Gray
                        )
                    }
                }
            }
        }
    }
}

