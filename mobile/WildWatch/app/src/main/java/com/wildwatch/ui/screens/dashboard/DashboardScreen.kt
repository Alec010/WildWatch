package com.wildwatch.ui.screens.dashboard

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.wildwatch.R
import com.wildwatch.ui.components.dashboard.IncidentCard
import com.wildwatch.ui.components.dashboard.IncidentInfo
import com.wildwatch.ui.components.dashboard.IncidentStatus
import com.wildwatch.ui.components.dashboard.StatCard
import com.wildwatch.ui.theme.*
import com.wildwatch.viewmodel.PublicIncidentsViewModel
import com.wildwatch.viewmodel.PublicIncidentsViewModelFactory
import com.wildwatch.utils.toIncidentInfo
import com.wildwatch.ui.components.NotificationDropdown
import com.wildwatch.navigation.Screen
import com.wildwatch.viewmodel.UserProfileViewModel

@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterialApi::class)
@Composable
fun DashboardScreen(
    navController: NavController,
    viewModel: PublicIncidentsViewModel,
    onIncidentClick: (String) -> Unit = {},
    onViewAllClick: () -> Unit = {},
    onViewAllNotifications: () -> Unit = {}
) {
    val context = LocalContext.current
    val userProfileViewModel: UserProfileViewModel = viewModel()
    val userProfile by userProfileViewModel.user.collectAsState()

    var showNotifications by remember { mutableStateOf(false) }
    var hasUnreadNotifications by remember { mutableStateOf(true) }
    var selectedTab by remember { mutableStateOf(0) }
    var upvoteDialogIncidentId by remember { mutableStateOf<String?>(null) }
    var upvoteDialogIncidentTitle by remember { mutableStateOf<String?>(null) }

    val publicIncidents by viewModel.publicIncidents.collectAsState()
    val userIncidents by viewModel.userIncidents.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val upvotedIncidents by viewModel.upvotedIncidents.collectAsState()

    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = viewModel::refresh
    )

    LaunchedEffect(Unit) {
        userProfileViewModel.fetchProfile(context)
        viewModel.fetchPublicIncidents()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.logo),
                            contentDescription = "WildWatch Logo",
                            modifier = Modifier.size(125.dp)
                        )
                    }
                },
                actions = {
                    Row {
                        Box {
                            IconButton(onClick = { showNotifications = true }) {
                                BadgedBox(
                                    badge = {
                                        if (hasUnreadNotifications) {
                                            Badge(
                                                containerColor = Color(0xFFE53935)
                                            )
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Notifications,
                                        contentDescription = "Notifications",
                                        tint = WildWatchRed
                                    )
                                }
                            }

                            NotificationDropdown(
                                showDropdown = showNotifications,
                                onDismiss = { showNotifications = false },
                                navController = navController,
                                onNotificationClick = { notification ->
                                    showNotifications = false
                                }
                            )
                        }
                        IconButton(onClick = { 
                            navController.navigate(Screen.Settings.route) {
                                popUpTo(Screen.Main.route)
                            }
                        }) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile",
                                tint = WildWatchRed
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        },
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .pullRefresh(pullRefreshState)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))

                    Column(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Incident Dashboard",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = WildWatchRed
                        )

                        Text(
                            text = "View and manage reported incidents",
                            fontSize = 14.sp,
                            color = Color.Gray
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Overview",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = WildWatchRed
                                )
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                StatCard(
                                    title = "Total Reports",
                                    count = userIncidents.size,
                                    icon = Icons.Default.Description,
                                    iconTint = Color(0xFF8B0000),
                                    modifier = Modifier.weight(1f)
                                )
                                StatCard(
                                    title = "Pending",
                                    count = userIncidents.count { it.status.equals("pending", ignoreCase = true) },
                                    icon = Icons.Default.Schedule,
                                    iconTint = Color(0xFFFFA000),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                StatCard(
                                    title = "In Progress",
                                    count = userIncidents.count { it.status.equals("in progress", ignoreCase = true) },
                                    icon = Icons.Default.Pending,
                                    iconTint = Color(0xFF1976D2),
                                    modifier = Modifier.weight(1f)
                                )
                                StatCard(
                                    title = "Resolved",
                                    count = userIncidents.count { it.status.equals("resolved", ignoreCase = true) },
                                    icon = Icons.Default.CheckCircle,
                                    iconTint = Color(0xFF4CAF50),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onViewAllClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = WildWatchRed)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.List,
                            contentDescription = null,
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("View All Cases", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                item {
                    // Tab Row
                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = Color.White,
                        contentColor = WildWatchRed
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = { Text("All Incidents") },
                            icon = { Icon(Icons.Default.Public, contentDescription = null) }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            text = { Text("My Incidents") },
                            icon = { Icon(Icons.Default.Person, contentDescription = null) }
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Content based on selected tab
                when (selectedTab) {
                    0 -> {
                        if (error != null) {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = error ?: "An error occurred",
                                        color = Color.Red
                                    )
                                }
                            }
                        } else {
                            val filteredPublicIncidents = publicIncidents.filter { 
                                it.submittedByEmail != userProfile?.email && !it.submittedByEmail.isNullOrBlank() && !it.id.isNullOrBlank()
                            }.also { list ->
                                list.forEach { incident ->
                                    android.util.Log.d("DashboardScreen", "IncidentResponse.id: ${incident.id}, trackingNumber: ${incident.trackingNumber}")
                                }
                            }
                            items(filteredPublicIncidents) { incident ->
                                val info = incident.toIncidentInfo().also {
                                    android.util.Log.d("DashboardScreen", "IncidentInfo.id: ${it.id}, trackingNumber: ${it.trackingNumber}")
                                }
                                IncidentCard(
                                    incident = info,
                                    onViewDetailsClick = { 
                                        android.util.Log.d("DashboardScreen", "Navigating to details for incident tracking number: ${info.trackingNumber}")
                                        onIncidentClick(info.trackingNumber) 
                                    },
                                    isUpvoted = upvotedIncidents.contains(incident.id),
                                    onUpvoteClick = {
                                        upvoteDialogIncidentId = incident.id
                                        upvoteDialogIncidentTitle = incident.incidentType
                                    },
                                    showUpvote = true
                                )
                            }
                        }
                    }
                    1 -> {
                        if (error != null) {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = error ?: "An error occurred",
                                        color = Color.Red
                                    )
                                }
                            }
                        } else {
                            items(userIncidents) { incident ->
                                val info = incident.toIncidentInfo()
                                IncidentCard(
                                    incident = info,
                                    onViewDetailsClick = { 
                                        android.util.Log.d("DashboardScreen", "Navigating to details for incident id: ${info.id}")
                                        onIncidentClick(info.id) 
                                    }
                                )
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(80.dp)) // Space for FAB
                }
            }

            // Centered loading indicator
            AnimatedVisibility(
                visible = loading || isRefreshing,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.3f)),
                    contentAlignment = Alignment.Center
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color.White,
                        shadowElevation = 4.dp
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(16.dp)
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier
                                    .size(48.dp)
                                    .padding(12.dp),
                                color = WildWatchRed
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = if (isRefreshing) "Refreshing..." else "Loading...",
                                color = WildWatchRed,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }

            // Only show upvote dialog in All Incidents tab
            if (selectedTab == 0 && upvoteDialogIncidentId != null) {
                AlertDialog(
                    onDismissRequest = { upvoteDialogIncidentId = null },
                    title = { Text("Confirm Upvote") },
                    text = {
                        Text("Are you sure you want to upvote this incident?" + (upvoteDialogIncidentTitle?.let { "\n\n$it" } ?: ""))
                    },
                    confirmButton = {
                        Button(
                            onClick = {
                                upvoteDialogIncidentId?.let { viewModel.toggleUpvote(it) }
                                upvoteDialogIncidentId = null
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = WildWatchRed)
                        ) {
                            Text("Upvote")
                        }
                    },
                    dismissButton = {
                        OutlinedButton(onClick = { upvoteDialogIncidentId = null }) {
                            Text("Cancel")
                        }
                    }
                )
            }
        }
    }
}
