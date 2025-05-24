package com.wildwatch.ui.components.dashboard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.ThumbUp
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.ui.theme.*

enum class IncidentStatus {
    IN_PROGRESS, RESOLVED, URGENT, PENDING
}

data class IncidentInfo(
    val id: String,
    val title: String,
    val location: String,
    val locationDetail: String,
    val description: String,
    val status: IncidentStatus,
    val timestamp: String,
    val upvoteCount: Int = 0
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncidentCard(
    incident: IncidentInfo,
    onViewDetailsClick: () -> Unit = {},
    isUpvoted: Boolean = false,
    onUpvoteClick: () -> Unit = {},
    showUpvote: Boolean = false
) {
    val (borderColor, statusColor, statusText) = when (incident.status) {
        IncidentStatus.IN_PROGRESS -> Triple(InProgressYellow, InProgressYellow, "In Progress")
        IncidentStatus.RESOLVED -> Triple(ResolvedGreen, ResolvedGreen, "Resolved")
        IncidentStatus.URGENT -> Triple(UrgentRed, UrgentRed, "Urgent")
        IncidentStatus.PENDING -> Triple(Color(0xFFFFA000), Color(0xFFFFA000), "Pending")
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 1.dp
        ),
        onClick = onViewDetailsClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
        ) {
            // Left border indicator
            Box(
                modifier = Modifier
                    .width(6.dp)
                    .fillMaxHeight()
                    .background(borderColor)
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // Title and timestamp
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        // Add an icon based on incident type
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = statusColor,
                            modifier = Modifier.size(20.dp)
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        Text(
                            text = incident.title,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Schedule,
                            contentDescription = null,
                            tint = Color.Gray,
                            modifier = Modifier.size(14.dp)
                        )

                        Spacer(modifier = Modifier.width(4.dp))

                        Text(
                            text = incident.timestamp,
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Location with icon
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
                        color = Color.Gray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Description with icon
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Color.Gray,
                        modifier = Modifier
                            .size(16.dp)
                            .padding(top = 2.dp)
                    )

                    Spacer(modifier = Modifier.width(4.dp))

                    Text(
                        text = incident.description,
                        fontSize = 14.sp,
                        color = Color.DarkGray,
                        lineHeight = 20.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Status chip, Upvote button, and View Details button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = statusColor.copy(alpha = 0.1f)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            // Status icon
                            val statusIcon = when (incident.status) {
                                IncidentStatus.IN_PROGRESS -> Icons.Default.Pending
                                IncidentStatus.RESOLVED -> Icons.Default.CheckCircle
                                IncidentStatus.URGENT -> Icons.Default.PriorityHigh
                                IncidentStatus.PENDING -> Icons.Default.Schedule
                            }

                            Icon(
                                imageVector = statusIcon,
                                contentDescription = null,
                                tint = statusColor,
                                modifier = Modifier.size(14.dp)
                            )

                            Spacer(modifier = Modifier.width(4.dp))

                            Text(
                                text = statusText,
                                color = statusColor,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (showUpvote) {
                            IconButton(
                                onClick = onUpvoteClick,
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = if (isUpvoted) Icons.Default.ThumbUp else Icons.Outlined.ThumbUp,
                                    contentDescription = "Upvote",
                                    tint = if (isUpvoted) WildWatchRed else Color.Gray
                                )
                            }
                            Text(
                                text = incident.upvoteCount.toString(),
                                fontSize = 12.sp,
                                color = if (isUpvoted) WildWatchRed else Color.Gray
                            )
                        }
                        // View Details button (always shown)
                        OutlinedButton(
                            onClick = onViewDetailsClick,
                            border = ButtonDefaults.outlinedButtonBorder.copy(
                                brush = SolidColor(WildWatchRed)
                            ),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = WildWatchRed
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Visibility,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "View Details",
                                fontWeight = FontWeight.Medium,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
