package com.wildwatch.ui.components.bottomnav

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.wildwatch.navigation.BottomNavItem
import com.wildwatch.ui.theme.WildWatchRed

@Composable
fun WildWatchBottomNavigation(
    items: List<BottomNavItem>,
    selectedItemRoute: String,
    onItemSelected: (BottomNavItem) -> Unit,
    modifier: Modifier = Modifier
) {
    // Simplified color palette
    val primaryRed = WildWatchRed
    val accentGold = Color(0xFFFFD700)
    val white = Color.White

    // Find items using Compose-friendly filtering
    val fabItem = remember(items) { items.find { it.isFab } }
    val regularItems = remember(items) { items.filter { !it.isFab } }

    // Increased FAB size
    val fabSize = 75.dp // Increased from 60.dp to 68.dp
    val navBarHeight = 80.dp
    val fabOverlap = 25.dp
    val totalHeight = navBarHeight + fabOverlap

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(totalHeight)
    ) {
        // Navigation bar background - no border radius, solid color
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(navBarHeight)
                .align(Alignment.BottomCenter),
            shape = RoundedCornerShape(0.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 16.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(primaryRed)
            )
        }

        // Navigation items using Compose Row layout
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(navBarHeight)
                .align(Alignment.BottomCenter)
                .padding(horizontal = 20.dp)
                .zIndex(1f),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            regularItems.forEachIndexed { index, item ->
                val selected = selectedItemRoute == item.route

                // Add spacer for FAB position
                if (index == regularItems.size / 2 && fabItem != null) {
                    Spacer(modifier = Modifier.width(fabSize))
                }

                ModernNavItem(
                    item = item,
                    selected = selected,
                    onClick = { onItemSelected(item) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // FAB positioned lower with text inside nav bar
        fabItem?.let { item ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .offset(y = (-10).dp) // Move the entire FAB column up slightly from bottom
                    .zIndex(3f)
            ) {
                // Main FAB - increased size
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(fabSize)
                        .shadow(
                            elevation = 12.dp,
                            shape = CircleShape,
                            ambientColor = primaryRed.copy(alpha = 0.3f),
                            spotColor = primaryRed.copy(alpha = 0.3f)
                        )
                        .background(white, CircleShape)
                        .border(
                            width = 3.dp,
                            color = primaryRed,
                            shape = CircleShape
                        )
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            role = Role.Button
                        ) { onItemSelected(item) }
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Report Incident",
                        tint = primaryRed,
                        modifier = Modifier.size(30.dp) // Increased icon size from 24.dp to 28.dp
                    )
                }

                // FAB labels positioned to fit within nav bar
                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = "Report",
                    color = white,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall
                )
                Text(
                    text = "Incident",
                    color = white.copy(alpha = 0.95f),
                    fontSize = 8.sp,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

@Composable
private fun ModernNavItem(
    item: BottomNavItem,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val accentGold = Color(0xFFFFD700)
    val white = Color.White

    // Compose animation APIs
    val iconColor by animateColorAsState(
        targetValue = if (selected) accentGold else white.copy(alpha = 0.85f),
        animationSpec = tween(200),
        label = "iconColor"
    )

    val textColor by animateColorAsState(
        targetValue = if (selected) accentGold else white.copy(alpha = 0.9f),
        animationSpec = tween(200),
        label = "textColor"
    )

    val backgroundColor by animateColorAsState(
        targetValue = if (selected) Color(0x20FFFFFF) else Color.Transparent,
        animationSpec = tween(200),
        label = "backgroundColor"
    )

    // Pure Compose Column layout
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(20.dp))
            .background(backgroundColor)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                role = Role.Tab
            ) { onClick() }
            .padding(vertical = 12.dp, horizontal = 8.dp)
    ) {
        // Icon container using Compose Box
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(36.dp)
        ) {
            // Selection background using Compose conditional rendering
            if (selected) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(
                            accentGold.copy(alpha = 0.2f),
                            CircleShape
                        )
                )
            }

            Icon(
                imageVector = item.icon,
                contentDescription = item.title,
                tint = iconColor,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(3.dp))

        // Text using Compose Text with Material Theme
        Text(
            text = item.title,
            color = textColor,
            fontSize = 9.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
            textAlign = TextAlign.Center,
            maxLines = 1,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 2.dp)
        )

        // Selection indicator using Compose conditional rendering
        if (selected) {
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .background(accentGold, CircleShape)
            )
        }
    }
}