package com.wildwatch.ui.screens.casetracking

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.ui.theme.WildWatchRed
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseTrackingScreen(
    onBackClick: () -> Unit = {},
    onCaseClick: (String) -> Unit = {}
) {
    // Define colors
    val primaryColor = WildWatchRed
    val backgroundColor = Color(0xFFF8F8F8)
    val cardColor = Color.White
    val newColor = Color(0xFFE63946)
    val inProgressColor = Color(0xFF457B9D)
    val resolvedColor = Color(0xFF2A9D8F)
    val awaitingColor = Color(0xFFE9C46A)

    // State for selected tab
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Active Cases", "Resolved Cases", "Recent Activity")

    // Sample data
    val statusCounts = mapOf(
        "New Reports" to 3,
        "In Progress" to 5,
        "Resolved" to 7,
        "Awaiting Response" to 1
    )

    val activeCases = listOf(
        CaseData(
            id = "WW-0003-0001",
            title = "Suspicious Activity",
            location = "Science Building",
            locationDetail = "2nd Floor Hallway",
            date = "October 23, 2023",
            time = "14:30",
            description = "Suspicious individual attempting to access locked lab room. Security personnel have been alerted to investigate the incident.",
            status = "New Report",
            statusColor = newColor,
            updates = listOf(
                UpdateData(
                    message = "Security team monitoring surveillance footage from the area",
                    date = "October 23, 2023",
                    time = "15:45"
                )
            )
        ),
        CaseData(
            id = "WW-0003-0002",
            title = "Theft",
            location = "Student Center",
            locationDetail = "Main Lounge",
            date = "October 22, 2023",
            time = "10:15",
            description = "Laptop theft. Two students had their laptops unattended. Case has been assigned to Officer Rodriguez.",
            status = "In Progress",
            statusColor = inProgressColor,
            updates = listOf(
                UpdateData(
                    message = "Interviewing witnesses and reviewing security footage",
                    date = "October 22, 2023",
                    time = "13:30"
                )
            )
        ),
        CaseData(
            id = "WW-0003-0003",
            title = "Vandalism",
            location = "Dormitory B",
            locationDetail = "East Wing",
            date = "October 21, 2023",
            time = "23:45",
            description = "Graffiti found on the eastern wall of the building. Photos submitted by resident.",
            status = "Awaiting Response",
            statusColor = awaitingColor,
            updates = listOf(
                UpdateData(
                    message = "Cleaning service sent to remove graffiti",
                    date = "October 22, 2023",
                    time = "08:30"
                )
            )
        )
    )

    val resolvedCases = listOf(
        CaseData(
            id = "WW-0002-0001",
            title = "Noise Complaint",
            location = "Dormitory A",
            locationDetail = "Room 302",
            date = "October 19, 2023",
            time = "22:30",
            description = "Repeated loud noise after quiet hours. Noise levels have been addressed and situation resolved.",
            status = "Resolved",
            statusColor = resolvedColor,
            updates = listOf(
                UpdateData(
                    message = "RA spoke with residents and issued warning",
                    date = "October 19, 2023",
                    time = "23:00"
                ),
                UpdateData(
                    message = "Follow-up check confirmed noise levels are acceptable",
                    date = "October 20, 2023",
                    time = "10:15"
                )
            )
        ),
        CaseData(
            id = "WW-0002-0002",
            title = "Lost Item",
            location = "Library",
            locationDetail = "Study Area",
            date = "October 18, 2023",
            time = "16:45",
            description = "Student reported lost wallet. Item was found and returned to the owner.",
            status = "Resolved",
            statusColor = resolvedColor,
            updates = listOf(
                UpdateData(
                    message = "Wallet located in lost and found",
                    date = "October 19, 2023",
                    time = "09:30"
                ),
                UpdateData(
                    message = "Owner contacted and wallet returned",
                    date = "October 19, 2023",
                    time = "14:15"
                )
            )
        )
    )

    val recentActivities = listOf(
        ActivityData(
            type = "New Message",
            icon = Icons.Outlined.Message,
            iconColor = inProgressColor,
            message = "Officer Rodriguez has sent a message regarding Case #WW-0003-0002",
            time = "Today, 11:30 AM"
        ),
        ActivityData(
            type = "Status Update",
            icon = Icons.Outlined.Refresh,
            iconColor = resolvedColor,
            message = "Case #WW-0002-0003 status changed from \"In Progress\" to \"Resolved\"",
            time = "Yesterday, 3:45 PM"
        ),
        ActivityData(
            type = "New Report Submitted",
            icon = Icons.Outlined.AddCircle,
            iconColor = newColor,
            message = "You submitted a new incident report for Suspicious Activity",
            time = "Oct 23, 2023, 2:30 PM"
        ),
        ActivityData(
            type = "Comment Added",
            icon = Icons.Outlined.Comment,
            iconColor = inProgressColor,
            message = "New comment added to Case #WW-0003-0001 by Security Officer Jackson",
            time = "Oct 22, 2023, 5:15 PM"
        )
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Case Tracking",
                        fontWeight = FontWeight.SemiBold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { /* Handle search */ }) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search"
                        )
                    }
                    IconButton(onClick = { /* Handle filter */ }) {
                        Icon(
                            imageVector = Icons.Default.FilterList,
                            contentDescription = "Filter"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = cardColor
                )
            )
        },
        containerColor = backgroundColor
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Status Overview
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    StatusCard(
                        title = "New Reports",
                        count = statusCounts["New Reports"] ?: 0,
                        color = newColor
                    )
                }
                item {
                    StatusCard(
                        title = "In Progress",
                        count = statusCounts["In Progress"] ?: 0,
                        color = inProgressColor
                    )
                }
                item {
                    StatusCard(
                        title = "Resolved",
                        count = statusCounts["Resolved"] ?: 0,
                        color = resolvedColor
                    )
                }
                item {
                    StatusCard(
                        title = "Awaiting",
                        count = statusCounts["Awaiting Response"] ?: 0,
                        color = awaitingColor
                    )
                }
            }

            // Tab Row
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = cardColor,
                contentColor = primaryColor,
                indicator = { tabPositions ->
                    TabRowDefaults.Indicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        height = 3.dp,
                        color = primaryColor
                    )
                }
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = {
                            Text(
                                text = title,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    )
                }
            }

            // Content based on selected tab
            when (selectedTab) {
                0 -> {
                    // Active Cases
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(activeCases) { caseData ->
                            CaseCard(
                                caseData = caseData,
                                onClick = { onCaseClick(caseData.id) }
                            )
                        }

                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
                1 -> {
                    // Resolved Cases
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(resolvedCases) { caseData ->
                            CaseCard(
                                caseData = caseData,
                                onClick = { onCaseClick(caseData.id) }
                            )
                        }

                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
                2 -> {
                    // Recent Activity
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(recentActivities) { activity ->
                            ActivityCard(activityData = activity)
                        }

                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatusCard(
    title: String,
    count: Int,
    color: Color
) {
    Card(
        modifier = Modifier
            .width(110.dp)
            .height(80.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = count.toString(),
                    color = color,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = title,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = Color.DarkGray,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun CaseCard(
    caseData: CaseData,
    onClick: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val rotationState by animateFloatAsState(
        targetValue = if (expanded) 180f else 0f,
        label = "rotation"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Case ID and Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = caseData.id,
                    fontSize = 12.sp,
                    color = Color.Gray
                )

                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = caseData.statusColor.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = caseData.status,
                        color = caseData.statusColor,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Title and Location
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Title
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = caseData.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    // Location
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.LocationOn,
                            contentDescription = null,
                            tint = Color.Gray,
                            modifier = Modifier.size(14.dp)
                        )

                        Spacer(modifier = Modifier.width(4.dp))

                        Text(
                            text = "${caseData.location} - ${caseData.locationDetail}",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Date and Time
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Schedule,
                            contentDescription = null,
                            tint = Color.Gray,
                            modifier = Modifier.size(14.dp)
                        )

                        Spacer(modifier = Modifier.width(4.dp))

                        Text(
                            text = "${caseData.date}, ${caseData.time}",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }

                // Expand/Collapse button
                IconButton(
                    onClick = { expanded = !expanded },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Collapse" else "Expand",
                        modifier = Modifier.rotate(rotationState)
                    )
                }
            }

            // Description and Updates (Expandable)
            AnimatedVisibility(
                visible = expanded,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                ) {
                    Divider(
                        color = Color.LightGray,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )

                    // Description
                    Text(
                        text = caseData.description,
                        fontSize = 14.sp,
                        color = Color.DarkGray
                    )

                    // Updates
                    if (caseData.updates.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "Latest Updates",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        caseData.updates.forEach { update ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(caseData.statusColor.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.Info,
                                        contentDescription = null,
                                        tint = caseData.statusColor,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.width(8.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = update.message,
                                        fontSize = 14.sp,
                                        color = Color.DarkGray
                                    )

                                    Text(
                                        text = "${update.date}, ${update.time}",
                                        fontSize = 12.sp,
                                        color = Color.Gray
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // View Full Details Button
                    OutlinedButton(
                        onClick = { /* Handle view details */ },
                        modifier = Modifier.align(Alignment.End),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = WildWatchRed
                        ),
                        border = BorderStroke(1.dp, WildWatchRed)
                    ) {
                        Text("View Full Details")
                    }
                }
            }
        }
    }
}

@Composable
fun ActivityCard(
    activityData: ActivityData
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(activityData.iconColor.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = activityData.icon,
                    contentDescription = null,
                    tint = activityData.iconColor,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Content
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = activityData.type,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = activityData.message,
                    fontSize = 14.sp,
                    color = Color.DarkGray
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = activityData.time,
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
        }
    }
}

data class CaseData(
    val id: String,
    val title: String,
    val location: String,
    val locationDetail: String,
    val date: String,
    val time: String,
    val description: String,
    val status: String,
    val statusColor: Color,
    val updates: List<UpdateData> = emptyList()
)

data class UpdateData(
    val message: String,
    val date: String,
    val time: String
)

data class ActivityData(
    val type: String,
    val icon: ImageVector,
    val iconColor: Color,
    val message: String,
    val time: String
)
