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
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.wildwatch.R
import com.wildwatch.ui.components.dashboard.IncidentCard
import com.wildwatch.ui.components.dashboard.IncidentInfo
import com.wildwatch.ui.components.dashboard.IncidentStatus
import com.wildwatch.ui.components.dashboard.StatCard
import com.wildwatch.ui.theme.*
import com.wildwatch.viewmodel.DashboardViewModel
import com.wildwatch.viewmodel.DashboardViewModelFactory
import com.wildwatch.utils.toIncidentInfo
import com.wildwatch.ui.components.NotificationDropdown
import com.wildwatch.navigation.Screen

@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterialApi::class)
@Composable
fun DashboardScreen(
    navController: NavController,
    onIncidentClick: (String) -> Unit = {},
    onViewAllClick: () -> Unit = {},
    onViewAllNotifications: () -> Unit = {}
) {
    val context = LocalContext.current
    val viewModel: DashboardViewModel = viewModel(
        factory = DashboardViewModelFactory(context)
    )

    var showNotifications by remember { mutableStateOf(false) }
    var hasUnreadNotifications by remember { mutableStateOf(true) }

    val total by viewModel.totalReports.collectAsState()
    val pending by viewModel.pendingReports.collectAsState()
    val inProgress by viewModel.inProgressReports.collectAsState()
    val resolved by viewModel.resolvedReports.collectAsState()
    val recentIncidents by viewModel.recentIncidents.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()

    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = viewModel::refresh
    )

    LaunchedEffect(Unit) {
        viewModel.fetchDashboardData()
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
                                // Handle notification click
                                showNotifications = false
                            }
                        )
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
                            text = "View and manage your reported incidents",
                            fontSize = 14.sp,
                            color = Color.Gray
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                item {
                    Column(
                        modifier = Modifier.fillMaxWidth()
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

                            Spacer(modifier = Modifier.width(8.dp))

                            HorizontalDivider(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(vertical = 8.dp),
                                color = WildWatchRed.copy(alpha = 0.3f),
                                thickness = 2.dp
                            )
                        }
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            title = "Total Reports",
                            count = total,
                            icon = Icons.Default.Description,
                            iconTint = Color(0xFF8B0000), // Dark red from the image
                            modifier = Modifier.weight(1f)
                        )

                        StatCard(
                            title = "Pending",
                            count = pending,
                            icon = Icons.Default.Schedule,
                            iconTint = Color(0xFFFFA000), // Amber color from the image
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            title = "In Progress",
                            count = inProgress,
                            icon = Icons.Default.Pending,
                            iconTint = Color(0xFF1976D2), // Blue color from the image
                            modifier = Modifier.weight(1f)
                        )

                        StatCard(
                            title = "Resolved",
                            count = resolved,
                            icon = Icons.Default.CheckCircle,
                            iconTint = Color(0xFF4CAF50), // Green color from the image
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Recent Incidents",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = WildWatchRed
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        HorizontalDivider(
                            modifier = Modifier
                                .weight(1f)
                                .padding(vertical = 8.dp),
                            color = WildWatchRed.copy(alpha = 0.3f),
                            thickness = 2.dp
                        )

                        TextButton(onClick = onViewAllClick) {
                            Text(
                                text = "View All",
                                color = WildWatchRed,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                // Show loading indicator or error message
                if (loading && recentIncidents.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = WildWatchRed)
                        }
                    }
                } else if (error != null && recentIncidents.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color(0xFFFFEBEE)
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Error,
                                    contentDescription = null,
                                    tint = WildWatchRed,
                                    modifier = Modifier.size(48.dp)
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = "Error loading incidents",
                                    fontWeight = FontWeight.Bold,
                                    color = WildWatchRed
                                )

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = error ?: "Unknown error",
                                    color = Color.Gray
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Button(
                                    onClick = viewModel::refresh,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = WildWatchRed
                                    )
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Refresh,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Retry")
                                }
                            }
                        }
                    }
                } else if (recentIncidents.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = null,
                                    tint = Color.Gray,
                                    modifier = Modifier.size(48.dp)
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = "No incidents found",
                                    color = Color.Gray
                                )
                            }
                        }
                    }
                }

                // Display incidents
                items(recentIncidents) { incident ->
                    IncidentCard(
                        incident = incident.toIncidentInfo(),
                        onViewDetailsClick = { onIncidentClick(incident.id) }
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(80.dp)) // Space for FAB
                }
            }

            // Pull to refresh indicator
            PullRefreshIndicator(
                refreshing = isRefreshing,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter),
                backgroundColor = Color.White,
                contentColor = WildWatchRed
            )

            // Show loading overlay when refreshing
            AnimatedVisibility(
                visible = loading && recentIncidents.isNotEmpty(),
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
                        CircularProgressIndicator(
                            modifier = Modifier
                                .size(48.dp)
                                .padding(12.dp),
                            color = WildWatchRed
                        )
                    }
                }
            }
        }
    }
}
