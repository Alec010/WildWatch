package com.wildwatch.ui.components.bottomnav

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.wildwatch.navigation.BottomNavItem

@Composable
fun WildWatchBottomNavigation(
    items: List<BottomNavItem>,
    selectedItemRoute: String,
    onItemSelected: (BottomNavItem) -> Unit,
    modifier: Modifier = Modifier
) {
    // Define colors
    val darkRed = Color(0xFF8B0000)
    val gold = Color(0xFFFFD700)
    val orange = Color(0xFFFF8C00)
    val white = Color.White

    // Find the FAB item
    val fabItem = items.find { it.isFab }

    // Calculate the total height needed for the navigation bar plus FAB
    val totalHeight = 90.dp
    val navBarHeight = 64.dp

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(totalHeight)
    ) {
        // Main navigation bar background
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(navBarHeight)
                .align(Alignment.BottomCenter)
                .background(darkRed)
                .zIndex(0f)
        )

        // Navigation items
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(navBarHeight)
                .align(Alignment.BottomCenter)
                .zIndex(1f),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEachIndexed { index, item ->
                if (item.isFab) {
                    // Empty space for FAB
                    Spacer(modifier = Modifier.width(80.dp))
                } else {
                    // Regular navigation item
                    val selected = selectedItemRoute == item.route
                    val iconColor = if (selected) gold else white
                    val textColor = if (selected) orange else white

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable { onItemSelected(item) }
                            .padding(top = 8.dp)
                    ) {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.title,
                            tint = iconColor,
                            modifier = Modifier.size(24.dp)
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = item.title,
                            color = textColor,
                            fontSize = 11.sp,
                            textAlign = TextAlign.Center,
                            maxLines = 1,
                            modifier = Modifier.padding(horizontal = 2.dp)
                        )
                    }
                }
            }
        }

        // FAB
        fabItem?.let {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = 0.dp)
                    .zIndex(2f)
            ) {
                // FAB with border
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(64.dp)
                        .shadow(4.dp, CircleShape)
                        .clip(CircleShape)
                        .background(Color.White)
                        .border(width = 3.dp, color = darkRed, shape = CircleShape)
                        .clickable { onItemSelected(it) }
                ) {
                    WarningTriangleIcon(
                        modifier = Modifier.size(30.dp),
                        color = darkRed
                    )
                }

                // Text below FAB
                Text(
                    text = "Report",
                    color = Color.White,
                    fontSize = 11.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 1.dp)
                )

                Text(
                    text = "Incident",
                    color = Color.White,
                    fontSize = 11.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

