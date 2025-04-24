package com.wildwatch.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
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
import com.wildwatch.R
import com.wildwatch.ui.components.dashboard.IncidentCard
import com.wildwatch.ui.components.dashboard.IncidentInfo
import com.wildwatch.ui.components.dashboard.IncidentStatus
import com.wildwatch.ui.components.dashboard.StatCard
import com.wildwatch.ui.theme.*
import androidx.compose.foundation.Image
import androidx.navigation.NavController
import com.wildwatch.navigation.Screen
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.viewmodel.DashboardViewModel
import com.wildwatch.viewmodel.DashboardViewModelFactory
import com.wildwatch.utils.toIncidentInfo

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onProfileClick: () -> Unit = {}
) {
    val context = LocalContext.current


    val viewModel: DashboardViewModel = viewModel(
        factory = DashboardViewModelFactory(context)
    )

    val total by viewModel.totalReports.collectAsState()
    val pending by viewModel.pendingReports.collectAsState()
    val inProgress by viewModel.inProgressReports.collectAsState()
    val resolved by viewModel.resolvedReports.collectAsState()
    val recentIncidents by viewModel.recentIncidents.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()

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
                    IconButton(onClick = {}) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = WildWatchRed
                        )
                    }

                    IconButton(onClick = { onProfileClick() }) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(WildWatchRed),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile",
                                tint = Color.White
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        },
        containerColor = LightGray
    ) { paddingValues ->
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (error != null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(text = "Error: $error", color = MaterialTheme.colorScheme.error)
            }
        } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
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
                        Text(
                            text = "Overview",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Divider(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            color = Color.LightGray
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        StatCard(
                            title = "Total Reports",
                            count = total,
                            icon = Icons.Default.Description,
                            iconTint = Color(0xFF5C6BC0),
                            modifier = Modifier.weight(1f)
                        )

                        StatCard(
                            title = "In Progress",
                            count = inProgress,
                            icon = Icons.Default.Pending,
                            iconTint = InProgressYellow,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        StatCard(
                            title = "Resolved",
                            count = resolved,
                            icon = Icons.Default.CheckCircle,
                            iconTint = ResolvedGreen,
                            modifier = Modifier.weight(1f)
                        )

                        StatCard(
                            title = "Pending",
                            count = pending,
                            icon = Icons.Default.Warning,
                            iconTint = UrgentRed,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Recent Incidents",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )

                        TextButton(onClick = { /* View all action */ }) {
                            Text(
                                text = "View All",
                                color = Color.Gray
                            )
                        }
                    }
                }

                items(recentIncidents) { incident ->
                    IncidentCard(incident = incident.toIncidentInfo())
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

