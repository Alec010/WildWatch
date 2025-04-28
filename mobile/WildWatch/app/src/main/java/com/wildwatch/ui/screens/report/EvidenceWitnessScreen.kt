package com.wildwatch.ui.screens.report

import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import androidx.activity.compose.ManagedActivityResultLauncher
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.model.WitnessDTO
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.IncidentFormViewModel
import com.wildwatch.ui.components.*
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.platform.LocalContext
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import java.io.File
import android.Manifest


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EvidenceWitnessScreen(
    onBackClick: () -> Unit = {},
    onContinueClick: () -> Unit = {},
    formViewModel: IncidentFormViewModel
) {
    // Define the request code for camera permission
    val REQUEST_CAMERA_PERMISSION: Int = 1001  // Specify the type explicitly

    val darkRed = WildWatchRed
    val backgroundColor = Color(0xFFF5F5F5)
    val context = LocalContext.current

    // Colors for the upload section
    val mintGreen = Color(0xFFB2EBE0)
    val lightRed  = Color(0xFFFFCDD2)

    // Form state
    var witnessName by remember { mutableStateOf("") }
    var witnessContact by remember { mutableStateOf("") }
    var witnessStatement by remember { mutableStateOf("") }
    var additionalNotes by remember { mutableStateOf("") }

    // Witness list state
    val witnesses = remember { mutableStateListOf<WitnessDTO>() }

    // Show add witness form
    var showWitnessForm by remember { mutableStateOf(false) }

    val formState by formViewModel.formState.collectAsState()

    // Evidence URIs
    val evidenceUris = remember { mutableStateListOf<Uri>() }

    // Sync values from ViewModel when formState changes
    LaunchedEffect(formState) {
        additionalNotes = formState.additionalNotes
        witnesses.clear()
        witnesses.addAll(formState.witnesses)
        evidenceUris.clear()
        evidenceUris.addAll(formState.evidenceUris.map { Uri.parse(it) })
    }

    // Permissions for camera and storage
    val permissions = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE
    )

    // Permission request launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissionsResult ->
        if (permissionsResult.values.all { it }) {
            // Permissions granted, proceed with camera functionality
        } else {
            // Handle permission denial (optional: show rationale or disable camera feature)
        }
    }

    // Request permissions if not granted
    LaunchedEffect(Unit) {
        val hasPermissions = permissions.all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
        if (!hasPermissions) {
            permissionLauncher.launch(permissions) // Request permissions
        }
    }

    // Image picker for uploading images
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        evidenceUris.addAll(uris)
    }

    // Temporary URI for saving the photo
    var currentPhotoUri by remember { mutableStateOf<Uri?>(null) }

    // Camera picker launcher for taking photos
    val takePhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success && currentPhotoUri != null) {
            evidenceUris.add(currentPhotoUri!!)
        }
    }

    // File provider URI to store the photo
    val photoUri = remember {
        FileProvider.getUriForFile(
            context,
            "com.wildwatch.fileprovider",
            File(context.cacheDir, "photo.jpg")
        )
    }

    Scaffold(
        containerColor = backgroundColor,
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "Report an Incident",
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
            // Subtitle
            Text(
                text = "Submit details about a security incident or concern",
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                color = Color.Gray,
                fontSize = 14.sp
            )

            // Progress steps
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ProgressStep(number = 1, title = "Incident Details", isActive = false, isCompleted = true)

                    // Line between steps 1 and 2
                    HorizontalDivider(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp),
                        color = darkRed,
                        thickness = 1.dp
                    )

                    ProgressStep(number = 2, title = "Evidence & Witnesses", isActive = true, isCompleted = false)

                    // Line between steps 2 and 3
                    HorizontalDivider(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp),
                        color = Color.Gray,
                        thickness = 1.dp
                    )

                    ProgressStep(number = 3, title = "Review & Submit", isActive = false, isCompleted = false)
                }
            }

            // Main content
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                // Main form card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
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
                            .padding(20.dp)
                    ) {
                        // Section icon and title
                        SectionHeader(
                            title = "Evidence & Witnesses",
                            icon = Icons.Default.Assignment,
                            color = darkRed
                        )

                        Text(
                            text = "Upload evidence and provide witness information",
                            color = Color.Gray,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 24.dp)
                        )

                        // Evidence Upload Section
                        SectionTitle(title = "Evidence Upload")
                        Text(
                            text = "Upload photos or videos related to the incident (optional)",
                            color = Color.Gray,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // Upload area - new design with camera icon and two buttons side by side
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .border(
                                    width = 1.dp,
                                    color = Color.LightGray,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                // Camera icon in mint green
                                Icon(
                                    imageVector = Icons.Default.CameraAlt,
                                    contentDescription = null,
                                    tint = darkRed,
                                    modifier = Modifier
                                        .size(48.dp)
                                        .padding(bottom = 16.dp)
                                )

                                // Two buttons side by side
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    // Take Photo button
                                    Button(
                                        onClick = {
                                            currentPhotoUri = photoUri
                                            takePhotoLauncher.launch(photoUri)
                                        },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = lightRed
                                        ),
                                        shape = RoundedCornerShape(4.dp),
                                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.PhotoCamera,
                                            contentDescription = null,
                                            tint = darkRed,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            "TAKE PHOTO",
                                            color = darkRed,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    // Upload button
                                    Button(
                                        onClick = { imagePickerLauncher.launch("image/*") },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = lightRed
                                        ),
                                        shape = RoundedCornerShape(4.dp),
                                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Upload,
                                            contentDescription = null,
                                            tint = darkRed,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            "UPLOAD",
                                            color = darkRed,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Maximum images text
                                Text(
                                    text = "Maximum upto 5 images",
                                    color = Color.Gray,
                                    fontSize = 12.sp
                                )
                            }
                        }

                        // Display uploaded images (thumbnails)
                        SectionTitle(
                            title = "Uploaded Files (${evidenceUris.size})",
                            trailingContent = {
                                if (evidenceUris.isNotEmpty()) {
                                    TextButton(
                                        onClick = {
                                            evidenceUris.clear() // Clear all uploaded images
                                        },
                                        colors = ButtonDefaults.textButtonColors(contentColor = darkRed)
                                    ) {
                                        Icon(imageVector = Icons.Default.Delete, contentDescription = "Clear all", modifier = Modifier.padding(end = 4.dp))
                                        Text("Clear All")
                                    }
                                }
                            }
                        )

                        // Check if there are any uploaded images
                        if (evidenceUris.isEmpty()) {
                            // No images uploaded yet
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(80.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .border(width = 1.dp, color = Color.LightGray, shape = RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                                    Icon(imageVector = Icons.Outlined.Info, contentDescription = null, tint = Color.Gray)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(text = "No files uploaded yet", color = Color.Gray, fontSize = 14.sp)
                                }
                            }
                        } else {
                            // Display uploaded images as thumbnails
                            LazyRow(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(100.dp)
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(evidenceUris) { uri ->
                                    ImageThumbnail(
                                        filename = uri.lastPathSegment ?: "image.jpg",
                                        imageUri = uri,
                                    )
                                }
                            }
                        }

                        // Witness Information
                        SectionTitle(
                            title = "Witness Information",
                            modifier = Modifier.padding(top = 24.dp)
                        )

                        Text(
                            text = "Provide details about any witnesses (optional)",
                            color = Color.Gray,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        // Display added witnesses
                        witnesses.forEachIndexed { index, witness ->
                            WitnessCard(
                                witness = witness,
                                onRemove = { witnesses.removeAt(index) },
                                modifier = Modifier.padding(bottom = 16.dp)
                            )
                        }

                        // Add witness button (when no form is shown)
                        if (!showWitnessForm && witnesses.isEmpty()) {
                            Button(
                                onClick = { showWitnessForm = true },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = darkRed
                                ),
                                modifier = Modifier.padding(bottom = 16.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Add,
                                    contentDescription = null,
                                    modifier = Modifier.padding(end = 8.dp)
                                )
                                Text("Add Witness")
                            }
                        }

                        // Witness form
                        AnimatedVisibility(
                            visible = showWitnessForm,
                            enter = fadeIn() + expandVertically(),
                            exit = fadeOut() + shrinkVertically()
                        ) {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 16.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = Color(0xFFF9F9F9)
                                )
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp)
                                ) {
                                    // Form title
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Add Witness",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp
                                        )

                                        IconButton(
                                            onClick = { showWitnessForm = false }
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Close,
                                                contentDescription = "Close form",
                                                tint = Color.Gray
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    // Name
                                    OutlinedTextField(
                                        value = witnessName,
                                        onValueChange = { witnessName = it },
                                        label = { Text("Name") },
                                        placeholder = { Text("Witness full name") },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(bottom = 12.dp),
                                        singleLine = true,
                                        shape = RoundedCornerShape(8.dp)
                                    )

                                    // Contact Information
                                    OutlinedTextField(
                                        value = witnessContact,
                                        onValueChange = { witnessContact = it },
                                        label = { Text("Contact Information") },
                                        placeholder = { Text("Email or phone number") },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(bottom = 12.dp),
                                        singleLine = true,
                                        shape = RoundedCornerShape(8.dp)
                                    )

                                    // Statement
                                    OutlinedTextField(
                                        value = witnessStatement,
                                        onValueChange = { witnessStatement = it },
                                        label = { Text("Statement (What did they see or hear?)") },
                                        placeholder = { Text("Describe what the witness observed") },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(120.dp)
                                            .padding(bottom = 12.dp),
                                        shape = RoundedCornerShape(8.dp)
                                    )

                                    // Add witness button
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.End
                                    ) {
                                        TextButton(
                                            onClick = { showWitnessForm = false },
                                            colors = ButtonDefaults.textButtonColors(
                                                contentColor = Color.Gray
                                            ),
                                            modifier = Modifier.padding(end = 8.dp)
                                        ) {
                                            Text("Cancel")
                                        }

                                        Button(
                                            onClick = {
                                                if (witnessName.isNotBlank()) {
                                                    witnesses.add(
                                                        WitnessDTO(
                                                            name = witnessName,
                                                            contactInformation = witnessContact,
                                                            statement = witnessStatement
                                                        )
                                                    )
                                                    // Clear form
                                                    witnessName = ""
                                                    witnessContact = ""
                                                    witnessStatement = ""
                                                    showWitnessForm = false // Hide form
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = darkRed
                                            ),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Add,
                                                contentDescription = null,
                                                modifier = Modifier.padding(end = 8.dp)
                                            )
                                            Text("Add Witness")
                                        }
                                    }
                                }
                            }
                        }

                        // Add another witness button (only show when form is hidden and there's at least one witness)
                        if (!showWitnessForm && witnesses.isNotEmpty()) {
                            TextButton(
                                onClick = { showWitnessForm = true },
                                colors = ButtonDefaults.textButtonColors(
                                    contentColor = darkRed
                                ),
                                modifier = Modifier.padding(bottom = 16.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Add,
                                    contentDescription = null,
                                    modifier = Modifier.padding(end = 4.dp)
                                )
                                Text("Add Another Witness")
                            }
                        }

                        // Additional Notes
                        SectionTitle(
                            title = "Additional Notes",
                            modifier = Modifier.padding(top = 8.dp)
                        )

                        Text(
                            text = "Any other details that might be helpful",
                            color = Color.Gray,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        OutlinedTextField(
                            value = additionalNotes,
                            onValueChange = { additionalNotes = it },
                            placeholder = { Text("Add any other relevant information about the incident") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(100.dp)
                                .padding(bottom = 24.dp),
                            shape = RoundedCornerShape(8.dp)
                        )

                        // Navigation buttons
                        FormNavigationButtons(
                            onBackClick = {
                                // Save form state before navigating back
                                formViewModel.updateFormState(
                                    formViewModel.formState.value.copy(
                                        witnesses = witnesses.toList(),
                                        evidenceUris = evidenceUris.map { it.toString() },
                                        additionalNotes = additionalNotes
                                    )
                                )
                                onBackClick()
                            },
                            onNextClick = {
                                // Save form state and continue
                                formViewModel.updateFormState(
                                    formViewModel.formState.value.copy(
                                        witnesses = witnesses.toList(),
                                        evidenceUris = evidenceUris.map { it.toString() },
                                        additionalNotes = additionalNotes
                                    )
                                )
                                onContinueClick()
                            },
                            darkRed = darkRed
                        )
                    }
                }

                // Help panel
                HelpPanel(
                    modifier = Modifier.fillMaxWidth(),
                    darkRed = darkRed
                )

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}
