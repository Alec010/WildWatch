package com.wildwatch.ui.screens.profile

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Save
import androidx.compose.material.icons.outlined.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.model.UserUpdateRequest
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.UserProfileViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBackClick: () -> Unit = {},
    onEditProfileClick: () -> Unit = {},
    onUpdateAccountClick: () -> Unit = {},
    onLogoutClick: () -> Unit = {}
) {
    // Define colors
    val primaryColor = Color(0xFF8B0000) // Original WildWatchRed
    val secondaryColor = Color(0xFF9E2A2B) // Slightly lighter red
    val accentColor = Color(0xFFE09F3E) // Gold accent
    val backgroundColor = Color(0xFFF9F7F7) // Light background
    val cardColor = Color.White
    val textPrimaryColor = Color(0xFF333333)
    val textSecondaryColor = Color(0xFF666666)

    val viewModel: UserProfileViewModel = viewModel()

    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var middleInitial by remember { mutableStateOf("") }
    var contactNumber by remember { mutableStateOf("") }

    // Store original values for cancel functionality
    val originalFirstName = remember { mutableStateOf("") }
    val originalLastName = remember { mutableStateOf("") }
    val originalMiddleInitial = remember { mutableStateOf("") }
    val originalContactNumber = remember { mutableStateOf("") }

    val user by viewModel.user.collectAsState()
    var isEditing by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.fetchProfile(context)
    }

    LaunchedEffect(user) {
        user?.let {
            firstName = it.firstName
            lastName = it.lastName
            middleInitial = it.middleInitial ?: ""
            contactNumber = it.contactNumber

            // Store original values for cancel functionality
            originalFirstName.value = it.firstName
            originalLastName.value = it.lastName
            originalMiddleInitial.value = it.middleInitial ?: ""
            originalContactNumber.value = it.contactNumber
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = WildWatchRed
                        )
                    }
                },
                actions = {},
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        },
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .background(backgroundColor)
        ) {
            // Profile Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            ) {
                // Gradient Background
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(primaryColor, secondaryColor)
                            )
                        )
                )

                // Profile Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .padding(top = 70.dp)
                        .shadow(
                            elevation = 4.dp,
                            shape = RoundedCornerShape(16.dp),
                            spotColor = Color.Black.copy(alpha = 0.1f)
                        ),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = cardColor
                    )
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Spacer(modifier = Modifier.height(40.dp))

                        // Name
                        Text(
                            text = firstName,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = textPrimaryColor
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        // ID and Role
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = accentColor.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "ID: ${user?.schoolIdNumber ?: ""} • ${user?.role ?: ""}",
                                color = accentColor.copy(alpha = 0.8f),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }

                // Profile Image
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .align(Alignment.TopCenter)
                        .offset(y = 30.dp)
                ) {
                    // Profile Image Background
                    Box(
                        modifier = Modifier
                            .size(90.dp)
                            .clip(CircleShape)
                            .background(cardColor)
                            .border(
                                width = 3.dp,
                                color = cardColor,
                                shape = CircleShape
                            )
                            .padding(3.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        // Profile Image
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(backgroundColor),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile Picture",
                                tint = primaryColor,
                                modifier = Modifier.size(50.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Information Sections
            ProfileSection(
                title = "Personal Information",
                icon = Icons.Outlined.Person,
                iconTint = primaryColor,
                backgroundColor = cardColor
            ) {
                // Name Fields Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // First Name
                    ProfileTextField(
                        value = firstName,
                        onValueChange = {
                            firstName = it.replaceFirstChar { char -> char.uppercaseChar() }
                        },
                        label = "First Name",
                        readOnly = !isEditing,
                        modifier = Modifier.weight(1f)
                    )

                    // Middle Initial
                    ProfileTextField(
                        value = middleInitial,
                        onValueChange = { middleInitial = it.uppercase().take(1) },
                        label = "M.I.",
                        readOnly = !isEditing,
                        modifier = Modifier.width(60.dp)
                    )

                    // Last Name
                    ProfileTextField(
                        value = lastName,
                        onValueChange = {
                            lastName = it.replaceFirstChar { char -> char.uppercaseChar() }
                        },
                        label = "Last Name",
                        readOnly = !isEditing,
                        modifier = Modifier.weight(1f)
                    )
                }

                // Contact Number
                ProfileTextField(
                    value = contactNumber,
                    onValueChange = { contactNumber = it },
                    label = "Contact Number",
                    readOnly = !isEditing,
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Outlined.Phone,
                            contentDescription = null,
                            tint = textSecondaryColor
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Account Information Section
            ProfileSection(
                title = "Account Information",
                icon = Icons.Outlined.AccountCircle,
                iconTint = primaryColor,
                backgroundColor = cardColor
            ) {
                // Institutional Email
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "Institutional Email",
                        fontSize = 12.sp,
                        color = textSecondaryColor,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    OutlinedTextField(
                        value = user?.email ?: "",
                        onValueChange = { },
                        readOnly = true,
                        enabled = false,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledBorderColor = Color.LightGray,
                            disabledTextColor = textSecondaryColor,
                            disabledContainerColor = backgroundColor.copy(alpha = 0.5f)
                        ),
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Outlined.Email,
                                contentDescription = null,
                                tint = textSecondaryColor
                            )
                        },
                        shape = RoundedCornerShape(12.dp)
                    )

                    Text(
                        text = "Email cannot be changed",
                        fontSize = 10.sp,
                        color = textSecondaryColor,
                        modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                    )
                }

                // Role
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "Role",
                        fontSize = 12.sp,
                        color = textSecondaryColor,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    OutlinedTextField(
                        value = user?.role ?: "",
                        onValueChange = { },
                        readOnly = true,
                        enabled = false,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledBorderColor = Color.LightGray,
                            disabledTextColor = textSecondaryColor,
                            disabledContainerColor = backgroundColor.copy(alpha = 0.5f)
                        ),
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Outlined.School,
                                contentDescription = null,
                                tint = textSecondaryColor
                            )
                        },
                        shape = RoundedCornerShape(12.dp)
                    )

                    Text(
                        text = "Role is assigned by the system",
                        fontSize = 10.sp,
                        color = textSecondaryColor,
                        modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Account Actions
            ProfileSection(
                title = "Account Actions",
                icon = Icons.Outlined.Settings,
                iconTint = primaryColor,
                backgroundColor = cardColor
            ) {
                // Action buttons
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (isEditing) {
                        // Show both Save and Cancel buttons when editing
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Cancel Button
                            OutlinedButton(
                                onClick = {
                                    // Reset to original values
                                    firstName = originalFirstName.value
                                    lastName = originalLastName.value
                                    middleInitial = originalMiddleInitial.value
                                    contactNumber = originalContactNumber.value
                                    isEditing = false
                                },
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = textSecondaryColor
                                ),
                                border = BorderStroke(1.dp, Color.LightGray),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(vertical = 12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Close,
                                    contentDescription = "Cancel",
                                    modifier = Modifier.padding(end = 8.dp)
                                )
                                Text(
                                    text = "Cancel",
                                    fontWeight = FontWeight.Medium
                                )
                            }

                            // Save Button
                            Button(
                                onClick = {
                                    if (
                                        firstName == user?.firstName &&
                                        lastName == user?.lastName &&
                                        middleInitial == (user?.middleInitial ?: "") &&
                                        contactNumber == user?.contactNumber
                                    ) {
                                        Toast.makeText(context, "No changes to save.", Toast.LENGTH_SHORT).show()
                                        isEditing = false
                                        return@Button
                                    }
                                    isSaving = true
                                    viewModel.updateUserProfile(
                                        context = context,
                                        updated = UserUpdateRequest(
                                            firstName = firstName,
                                            lastName = lastName,
                                            middleInitial = middleInitial,
                                            contactNumber = contactNumber
                                        ),
                                        onSuccess = {
                                            Toast.makeText(context, "Profile updated!", Toast.LENGTH_SHORT).show()
                                            isSaving = false
                                            isEditing = false
                                        },
                                        onError = {
                                            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
                                            isSaving = false
                                        }
                                    )
                                },
                                enabled = !isSaving,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = primaryColor
                                ),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(vertical = 12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Save,
                                    contentDescription = "Save",
                                    modifier = Modifier.padding(end = 8.dp)
                                )
                                Text(
                                    text = "Save Changes",
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    } else {
                        // Edit Profile Button (only when not editing)
                        Button(
                            onClick = { isEditing = true },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = primaryColor
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(vertical = 12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Edit,
                                contentDescription = "Edit",
                                modifier = Modifier.padding(end = 8.dp)
                            )
                            Text(
                                text = "Edit Profile",
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    // Logout Button (only show when not editing)
                    AnimatedVisibility(
                        visible = !isEditing,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        OutlinedButton(
                            onClick = {
                                onLogoutClick() // This will now handle logout
                            },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color(0xFF8B0000)
                            ),
                            border = BorderStroke(1.dp, Color(0xFF8B0000)),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(vertical = 12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Logout,
                                contentDescription = "Logout",
                                modifier = Modifier.padding(end = 8.dp)
                            )
                            Text(
                                text = "Logout",
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun ProfileSection(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    backgroundColor: Color = Color.White,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = backgroundColor
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // Section Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(24.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF333333)
                )
            }

            Divider(color = Color(0xFFEEEEEE))

            // Section Content
            content()
        }
    }
}

@Composable
fun ProfileTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    readOnly: Boolean = true,
    leadingIcon: @Composable (() -> Unit)? = null
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        readOnly = readOnly,
        modifier = modifier,
        colors = OutlinedTextFieldDefaults.colors(
            unfocusedBorderColor = Color.LightGray,
            unfocusedLabelColor = Color.Gray,
            unfocusedContainerColor = if (readOnly) Color(0xFFFAFAFA) else Color.White
        ),
        leadingIcon = leadingIcon,
        shape = RoundedCornerShape(12.dp)
    )
}
