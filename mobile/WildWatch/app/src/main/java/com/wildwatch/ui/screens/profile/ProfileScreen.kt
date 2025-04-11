package com.wildwatch.ui.screens.profile

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.ui.theme.WildWatchRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBackClick: () -> Unit = {},
    onEditProfileClick: () -> Unit = {},
    onUpdateAccountClick: () -> Unit = {},
    onDeleteAccountClick: () -> Unit = {}
) {
    val darkRed = WildWatchRed

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "Profile",
                        fontWeight = FontWeight.Medium,
                        color = darkRed
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = darkRed
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
        ) {
            // Profile Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .background(darkRed)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    // Profile Image with Edit Icon
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .padding(4.dp)
                    ) {
                        // Profile Image
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .align(Alignment.Center),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile Picture",
                                tint = Color.Gray,
                                modifier = Modifier.size(40.dp)
                            )
                        }

                        // Edit Icon
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .align(Alignment.BottomEnd)
                                .clickable { onEditProfileClick() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Edit,
                                contentDescription = "Edit Profile Picture",
                                tint = darkRed,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Name
                    Text(
                        text = "John Smith",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // ID and Role
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0x33FFFFFF) // Semi-transparent white
                    ) {
                        Text(
                            text = "ID: 22-2222-222 • Student",
                            color = Color.White,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            // Personal Information Section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Personal Information",
                    color = darkRed,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Name Fields Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // First Name
                    OutlinedTextField(
                        value = "Alec",
                        onValueChange = { },
                        label = { Text("First Name") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color.LightGray,
                            unfocusedLabelColor = Color.Gray
                        )
                    )

                    // Middle Initial
                    OutlinedTextField(
                        value = "R",
                        onValueChange = { },
                        label = { Text("M.I.") },
                        singleLine = true,
                        modifier = Modifier.width(60.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color.LightGray,
                            unfocusedLabelColor = Color.Gray
                        )
                    )

                    // Last Name
                    OutlinedTextField(
                        value = "Arola",
                        onValueChange = { },
                        label = { Text("Last Name") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color.LightGray,
                            unfocusedLabelColor = Color.Gray
                        )
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Contact Number
                OutlinedTextField(
                    value = "09123456789",
                    onValueChange = { },
                    label = { Text("Contact Number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color.LightGray,
                        unfocusedLabelColor = Color.Gray
                    )
                )
            }

            // Account Information Section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Account Information",
                    color = darkRed,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Institutional Email
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Institutional Email",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )

                    OutlinedTextField(
                        value = "alec",
                        onValueChange = { },
                        readOnly = true,
                        enabled = false,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color.LightGray,
                            disabledBorderColor = Color.LightGray,
                            disabledTextColor = Color.DarkGray
                        )
                    )

                    Text(
                        text = "Email cannot be changed",
                        fontSize = 10.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Role
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Role",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )

                    OutlinedTextField(
                        value = "Student",
                        onValueChange = { },
                        readOnly = true,
                        enabled = false,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color.LightGray,
                            disabledBorderColor = Color.LightGray,
                            disabledTextColor = Color.DarkGray
                        )
                    )

                    Text(
                        text = "Role is assigned by the system",
                        fontSize = 10.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                    )
                }
            }

            // Buttons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Delete Account Button
                OutlinedButton(
                    onClick = onDeleteAccountClick,
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = darkRed
                    ),
                    border = BorderStroke(1.dp, darkRed),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Delete Account")
                }

                // Edit Profile Button
                Button(
                    onClick = onEditProfileClick,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = darkRed
                    ),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Edit Profile")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
