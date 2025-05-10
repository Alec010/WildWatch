package com.wildwatch.ui.screens.report

import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.wildwatch.model.WitnessDTO
import com.wildwatch.ui.components.*
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.IncidentFormViewModel
import java.io.File
import android.Manifest
import android.widget.Toast
import androidx.compose.ui.graphics.Color
import android.webkit.MimeTypeMap

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EvidenceWitnessScreen(
    onBackClick: () -> Unit = {},
    onContinueClick: () -> Unit = {},
    formViewModel: IncidentFormViewModel
) {
    val darkRed = WildWatchRed
    val backgroundColor = Color(0xFFF5F5F5)
    val context = LocalContext.current

    // Colors for the upload section
    val lightRed = Color(0xFFFFCDD2)

    // Form state from ViewModel
    val formState by formViewModel.formState.collectAsState()

    // Local state for form fields
    var witnessName by remember { mutableStateOf("") }
    var witnessContact by remember { mutableStateOf("") }
    var witnessNotes by remember { mutableStateOf("") }
    var additionalNotes by remember { mutableStateOf(formState.additionalNotes) }

    // Local state for UI
    var showWitnessForm by remember { mutableStateOf(false) }

    // Mutable state lists that sync with ViewModel
    val witnesses = remember { mutableStateListOf<WitnessDTO>() }
    val evidenceUris = remember { mutableStateListOf<Uri>() }
    val evidenceFiles = remember { mutableStateListOf<File>() }

    // Sync local state with ViewModel when formState changes
    LaunchedEffect(formState) {
        additionalNotes = formState.additionalNotes
        witnesses.clear()
        witnesses.addAll(formState.witnesses)
        evidenceUris.clear()
        evidenceUris.addAll(formState.evidenceUris.map { Uri.parse(it) })
        evidenceFiles.clear()
        // Only add files that exist in the cache directory
        formState.evidenceFiles.forEach { file ->
            try {
                val cacheFile = File(context.cacheDir, file.name)
                if (cacheFile.exists()) {
                    evidenceFiles.add(cacheFile)
                } else if (file.exists()) {
                    // If the original file exists but not in cache, copy it
                    file.copyTo(cacheFile, overwrite = true)
                    evidenceFiles.add(cacheFile)
                }
            } catch (e: Exception) {
                Log.e("EvidenceWitnessScreen", "Error handling file: ${e.message}")
            }
        }
    }

    // Permission for camera only
    val cameraPermission = Manifest.permission.CAMERA

    // Permission request launcher for camera
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Log.d("Permissions", "Camera permission granted")
        } else {
            Toast.makeText(
                context,
                "Camera permission is required to take photos",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    // Check and request camera permission on initial load
    LaunchedEffect(Unit) {
        val hasCameraPermission = ContextCompat.checkSelfPermission(
            context,
            cameraPermission
        ) == PackageManager.PERMISSION_GRANTED
        if (!hasCameraPermission) {
            permissionLauncher.launch(cameraPermission)
        }
    }

    // Temporary URI for saving the photo
    var currentPhotoUri by remember { mutableStateOf<Uri?>(null) }

    // Clear all button handler
    TextButton(
        onClick = {
            evidenceUris.clear()
            evidenceFiles.clear()
            formViewModel.clearEvidence()
        },
        colors = ButtonDefaults.textButtonColors(contentColor = darkRed)
    ) {
        Icon(
            imageVector = Icons.Default.Delete,
            contentDescription = "Clear all",
            modifier = Modifier.padding(end = 4.dp)
        )
        Text("Clear All")
    }

    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            try {
                uris.forEach { uri ->
                    try {
                        val inputStream = context.contentResolver.openInputStream(uri)
                        val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
                        val extension = MimeTypeMap.getSingleton()
                            .getExtensionFromMimeType(mimeType) ?: "jpg"
                        
                        // Create a unique filename with timestamp and proper extension
                        val fileName = "evidence_${System.currentTimeMillis()}_${uri.lastPathSegment?.substringAfterLast('/')?.substringBeforeLast('.')}.$extension"
                        val file = File(context.cacheDir, fileName)
                        
                        inputStream?.use { input ->
                            file.outputStream().use { output ->
                                input.copyTo(output)
                            }
                        }
                        
                        if (file.exists()) {
                            evidenceUris.add(uri)
                            evidenceFiles.add(file)
                            formViewModel.addEvidence(uri.toString(), file)
                            Log.d("EvidenceWitnessScreen", "Added file: $fileName (${file.length()} bytes)")
                        } else {
                            Log.e("EvidenceWitnessScreen", "File creation failed: $fileName")
                            Toast.makeText(context, "Error saving file: $fileName", Toast.LENGTH_SHORT).show()
                        }
                    } catch (e: Exception) {
                        Log.e("EvidenceWitnessScreen", "Error processing file: ${e.message}")
                        Toast.makeText(context, "Error processing file: ${uri.lastPathSegment}", Toast.LENGTH_SHORT).show()
                    }
                }
                Log.d("EvidenceWitnessScreen", "Added ${uris.size} images, total: ${evidenceUris.size}")
            } catch (e: Exception) {
                Log.e("EvidenceWitnessScreen", "Error handling files: ${e.message}")
                Toast.makeText(context, "Error processing files", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Camera launcher
    val takePhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success && currentPhotoUri != null) {
            try {
                val inputStream = context.contentResolver.openInputStream(currentPhotoUri!!)
                val mimeType = context.contentResolver.getType(currentPhotoUri!!) ?: "image/jpeg"
                val extension = MimeTypeMap.getSingleton()
                    .getExtensionFromMimeType(mimeType) ?: "jpg"
                
                // Create a unique filename with timestamp and proper extension
                val fileName = "photo_${System.currentTimeMillis()}.$extension"
                val file = File(context.cacheDir, fileName)
                
                inputStream?.use { input ->
                    file.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                
                if (file.exists()) {
                    evidenceUris.add(currentPhotoUri!!)
                    evidenceFiles.add(file)
                    formViewModel.addEvidence(currentPhotoUri.toString(), file)
                    Log.d("EvidenceWitnessScreen", "Added photo: $fileName (${file.length()} bytes)")
                } else {
                    Log.e("EvidenceWitnessScreen", "File creation failed: $fileName")
                    Toast.makeText(context, "Error saving photo", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Log.e("EvidenceWitnessScreen", "Error processing camera photo: ${e.message}")
                Toast.makeText(context, "Error processing photo", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // File provider URI to store the photo
    val photoUri = remember {
        FileProvider.getUriForFile(
            context,
            "com.wildwatch.fileprovider",
            File(context.cacheDir, "photo_${System.currentTimeMillis()}.jpg")
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
                    IconButton(onClick = {
                        updateFormStateBeforeNavigation(formViewModel, witnesses, evidenceUris, "")
                        onBackClick()
                    }) {
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
                    HorizontalDivider(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp),
                        color = darkRed,
                        thickness = 1.dp
                    )
                    ProgressStep(number = 2, title = "Evidence & Witnesses", isActive = true, isCompleted = false)
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
                // Evidence Upload Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp, bottom = 12.dp),
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Upload,
                                contentDescription = null,
                                tint = darkRed,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            SectionTitle(title = "Evidence Upload")
                        }
                        Text(
                            text = "Upload photos or videos related to the incident (optional)",
                            color = Color.Gray,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
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
                                Icon(
                                    imageVector = Icons.Default.CameraAlt,
                                    contentDescription = null,
                                    tint = darkRed,
                                    modifier = Modifier
                                        .size(48.dp)
                                        .padding(bottom = 16.dp)
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = {
                                            val hasCameraPermission = ContextCompat.checkSelfPermission(
                                                context,
                                                cameraPermission
                                            ) == PackageManager.PERMISSION_GRANTED
                                            if (hasCameraPermission) {
                                                currentPhotoUri = photoUri
                                                takePhotoLauncher.launch(photoUri)
                                            } else {
                                                permissionLauncher.launch(cameraPermission)
                                            }
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
                                            "PHOTO",
                                            color = darkRed,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Button(
                                        onClick = {
                                            imagePickerLauncher.launch("image/*")
                                        },
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
                                Text(
                                    text = "Maximum up to 5 images",
                                    color = Color.Gray,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
                // Uploaded Files Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Folder,
                                contentDescription = null,
                                tint = darkRed,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            SectionTitle(title = "Uploaded Files (${evidenceUris.size})",
                                trailingContent = {
                                    if (evidenceUris.isNotEmpty()) {
                                        TextButton(
                                            onClick = {
                                                evidenceUris.clear()
                                                evidenceFiles.clear()
                                                formViewModel.clearEvidence()
                                            },
                                            colors = ButtonDefaults.textButtonColors(contentColor = darkRed)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Delete,
                                                contentDescription = "Clear all",
                                                modifier = Modifier.padding(end = 4.dp)
                                            )
                                            Text("Clear All")
                                        }
                                    }
                                }
                            )
                        }
                        if (evidenceUris.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(80.dp)
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
                            LazyRow(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(100.dp)
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                itemsIndexed(evidenceUris.toList()) { index, uri ->
                                    Box(modifier = Modifier.padding(4.dp)) {
                                        ImageThumbnail(
                                            filename = uri.lastPathSegment ?: "image.jpg",
                                            imageUri = uri
                                        )
                                        IconButton(
                                            onClick = {
                                                evidenceUris.removeAt(index)
                                                evidenceFiles.removeAt(index)
                                                formViewModel.removeEvidence(index)
                                            },
                                            modifier = Modifier
                                                .size(20.dp)
                                                .align(Alignment.TopEnd)
                                                .padding(2.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Close,
                                                contentDescription = "Remove image",
                                                tint = darkRed,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                // Witness Information Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = darkRed,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            SectionTitle(title = "Witness Information")
                        }
                        Text(
                            text = "Provide details about any witnesses (optional)",
                            color = Color.Gray,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        witnesses.forEachIndexed { index, witness ->
                            WitnessCard(
                                witness = witness,
                                onRemove = {
                                    witnesses.removeAt(index)
                                    formViewModel.updateFormState(
                                        formState.copy(
                                            witnesses = witnesses.toList()
                                        )
                                    )
                                },
                                modifier = Modifier.padding(bottom = 16.dp)
                            )
                        }
                        if (!showWitnessForm && witnesses.isEmpty()) {
                            Button(
                                onClick = { showWitnessForm = true },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = darkRed
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 16.dp),
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
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Spacer(modifier = Modifier.weight(1f))
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
                                    // Name field with header
                                    Text(
                                        text = "Name",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        modifier = Modifier.padding(bottom = 4.dp)
                                    )
                                    OutlinedTextField(
                                        value = witnessName,
                                        onValueChange = { witnessName = it },
                                        placeholder = { Text("Witness full name") },
                                        modifier = Modifier
                                            .fillMaxWidth(),
                                        singleLine = true,
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    // Contact Information field with header
                                    Text(
                                        text = "Contact Information",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        modifier = Modifier.padding(bottom = 4.dp)
                                    )
                                    OutlinedTextField(
                                        value = witnessContact,
                                        onValueChange = { witnessContact = it },
                                        placeholder = { Text("Email or phone number") },
                                        modifier = Modifier
                                            .fillMaxWidth(),
                                        singleLine = true,
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = "Additional Notes (What did they see or hear?)",
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(bottom = 4.dp)
                                    )
                                    OutlinedTextField(
                                        value = witnessNotes,
                                        onValueChange = { witnessNotes = it },
                                        placeholder = { Text("Describe what the witness observed") },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(100.dp)
                                            .padding(bottom = 12.dp),
                                        shape = RoundedCornerShape(8.dp)
                                    )
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
                                                if (witnessName.isBlank()) {
                                                    Toast.makeText(
                                                        context,
                                                        "Witness name is required",
                                                        Toast.LENGTH_SHORT
                                                    ).show()
                                                    return@Button
                                                }
                                                val newWitness = WitnessDTO(
                                                    name = witnessName,
                                                    contactInformation = witnessContact,
                                                    additionalNotes = witnessNotes
                                                )
                                                witnesses.add(newWitness)
                                                formViewModel.updateFormState(
                                                    formState.copy(
                                                        witnesses = witnesses.toList()
                                                    )
                                                )
                                                witnessName = ""
                                                witnessContact = ""
                                                witnessNotes = ""
                                                showWitnessForm = false
                                                Log.d("EvidenceWitnessScreen", "Added witness, total: ${witnesses.size}")
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
                        FormNavigationButtons(
                            onBackClick = {
                                updateFormStateBeforeNavigation(formViewModel, witnesses, evidenceUris, "")
                                onBackClick()
                            },
                            onNextClick = {
                                updateFormStateBeforeNavigation(formViewModel, witnesses, evidenceUris, "")
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

/**
 * Helper function to update the form state in the ViewModel before navigation
 */
private fun updateFormStateBeforeNavigation(
    formViewModel: IncidentFormViewModel,
    witnesses: List<WitnessDTO>,
    evidenceUris: List<Uri>,
    additionalNotes: String
) {
    formViewModel.updateFormState(
        formViewModel.formState.value.copy(
            witnesses = witnesses.toList(),
            evidenceUris = evidenceUris.map { it.toString() },
            additionalNotes = additionalNotes
        )
    )
    Log.d("EvidenceWitnessScreen", "Form state updated before navigation: " +
            "witnesses=${witnesses.size}, evidence=${evidenceUris.size}, notes=${additionalNotes.length} chars")
}
