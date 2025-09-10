package com.wildwatch.ui.screens.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.outlined.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.model.LeaderboardEntry
import com.wildwatch.viewmodel.LeaderboardViewModel
import com.wildwatch.viewmodel.LeaderboardViewModel.Factory
import androidx.compose.foundation.clickable
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Error
import com.wildwatch.ui.theme.WildWatchRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaderboardScreen(
    onBackClick: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val viewModel: LeaderboardViewModel = viewModel(factory = Factory(context))
    val topReporters by viewModel.topReporters.collectAsState()
    val topOffices by viewModel.topOffices.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        viewModel.fetchLeaderboard()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Leaderboard",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = WildWatchRed
                        )
                        Text(
                            text = "See who's leading in incident reporting.",
                            fontSize = 14.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                },
                navigationIcon = {
                    if (onBackClick != null) {
                        IconButton(onClick = onBackClick) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
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
                .background(Color(0xFFF8F9FA))
        ) {
            // Custom Tab Row
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color.White,
                shadowElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    CustomTab(
                        text = "Students",
                        icon = Icons.Outlined.School,
                        isSelected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        modifier = Modifier.weight(1f)
                    )
                    CustomTab(
                        text = "Offices",
                        icon = Icons.Default.Business,
                        isSelected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            when {
                loading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = WildWatchRed)
                    }
                }
                error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Error,
                                contentDescription = null,
                                tint = WildWatchRed,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = error ?: "Error loading leaderboard",
                                style = MaterialTheme.typography.bodyLarge,
                                color = Color.Gray,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
                else -> {
                    val entries = if (selectedTab == 0) topReporters else topOffices
                    if (entries.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No leaderboard data available",
                                style = MaterialTheme.typography.bodyLarge,
                                color = Color.Gray
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            itemsIndexed(entries) { index, entry ->
                                LeaderboardItem(
                                    entry = entry,
                                    rank = index + 1,
                                    isTopThree = index < 3
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CustomTab(
    text: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (isSelected) WildWatchRed else Color.Gray,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = text,
            color = if (isSelected) WildWatchRed else Color.Gray,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
            fontSize = 14.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        if (isSelected) {
            Box(
                modifier = Modifier
                    .width(40.dp)
                    .height(3.dp)
                    .background(
                        WildWatchRed,
                        RoundedCornerShape(2.dp)
                    )
            )
        }
    }
}

@Composable
fun LeaderboardItem(
    entry: LeaderboardEntry,
    rank: Int,
    isTopThree: Boolean
) {
    var isExpanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isTopThree) 4.dp else 2.dp
        )
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isExpanded = !isExpanded }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Rank and Trophy/Medal
                Box(
                    modifier = Modifier.size(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    when (rank) {
                        1 -> RankIcon(rank = 1, color = Color(0xFFFFD700)) // Gold
                        2 -> RankIcon(rank = 2, color = Color(0xFFC0C0C0)) // Silver
                        3 -> RankIcon(rank = 3, color = Color(0xFFCD7F32)) // Bronze
                        else -> {
                            Text(
                                text = rank.toString(),
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF4A5568)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(16.dp))

                // Name and Score
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = entry.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF2D3748)
                    )
                    Text(
                        text = "Score: ${entry.points ?: 0}",
                        fontSize = 14.sp,
                        color = Color(0xFF718096)
                    )
                }

                // Expand/Collapse Icon
                IconButton(
                    onClick = { isExpanded = !isExpanded }
                ) {
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = if (isExpanded) "Collapse" else "Expand",
                        tint = Color(0xFF718096)
                    )
                }
            }

            // Expanded Details
            if (isExpanded) {
                HorizontalDivider(color = Color(0xFFE2E8F0))
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    if (entry.averageRating != null) {
                        DetailRow(
                            label = "Average Rating",
                            value = "%.1f".format(entry.averageRating)
                        )
                    }
                    if (entry.totalIncidents != null) {
                        DetailRow(
                            label = "Total Reports",
                            value = entry.totalIncidents.toString()
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun RankIcon(rank: Int, color: Color) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .background(
                color.copy(alpha = 0.2f),
                RoundedCornerShape(16.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = rank.toString(),
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            color = Color(0xFF718096)
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFF2D3748)
        )
    }
}