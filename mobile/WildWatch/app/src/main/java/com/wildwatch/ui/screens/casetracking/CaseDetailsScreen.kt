package com.wildwatch.ui.screens.casetracking

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.vector.ImageVector
import com.wildwatch.R
import com.wildwatch.model.EvidenceDTO
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.CaseDetailsViewModel
import com.wildwatch.viewmodel.CaseDetailsUiState
import coil.compose.AsyncImage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseDetailsScreen(
    viewModel: CaseDetailsViewModel,
    trackingNumber: String,
    onBackClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    LaunchedEffect(trackingNumber) {
        viewModel.fetchCaseDetails(trackingNumber)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Case Details") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = WildWatchRed
                )
            )
        }
    ) { paddingValues ->
        when (uiState) {
            is CaseDetailsUiState.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = WildWatchRed)
                }
            }
            is CaseDetailsUiState.Error -> {
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
                            text = (uiState as CaseDetailsUiState.Error).message,
                            style = MaterialTheme.typography.bodyLarge,
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
            is CaseDetailsUiState.Success -> {
                val incident = (uiState as CaseDetailsUiState.Success).incident
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .verticalScroll(scrollState)
                        .background(Color(0xFFF5F5F5))
                ) {
                    // Header Section with Case Info
                    CaseHeader(
                        caseNumber = incident.trackingNumber,
                        priorityLevel = incident.priorityLevel ?: "LOW",
                        isDismissed = incident.status.equals("Dismissed", ignoreCase = true)
                    )

                    // Progress Tracker
                    ProgressTracker(
                        status = incident.status,
                        isDismissed = incident.status.equals("Dismissed", ignoreCase = true)
                    )

                    // Dates Section
                    DatesSection(
                        submittedDate = incident.submittedAt,
                        lastUpdated = incident.submittedAt, // TODO: Add last updated field to API
                        estimatedResolution = incident.finishedDate ?: "Pending"
                    )

                    // Main Content
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        // Incident Details
                        IncidentDetailsCard(
                            incidentType = incident.incidentType,
                            location = incident.location,
                            dateTime = "${incident.dateOfIncident} ${incident.timeOfIncident}",
                            description = incident.description
                        )

                        // Case Information
                        CaseInformationCard(
                            assignedTo = incident.officeAdminName ?: "Not Assigned",
                            office = incident.assignedOffice,
                            contactEmail = "tsg@wildwatch.org", // TODO: Add to API
                            contactPhone = "+1234567890" // TODO: Add to API
                        )

                        // Evidence Section
                        if (incident.evidence != null) {
                            EvidenceCard(evidence = incident.evidence)
                        }

                        // Reporter Information
                        ReporterInformationCard(
                            name = incident.submittedByFullName ?: "Anonymous",
                            email = incident.submittedByEmail ?: "Not provided",
                            phone = incident.submittedByPhone ?: "Not provided"
                        )

                        // Next Steps
                        NextStepsCard(
                            status = incident.status,
                            isDismissed = incident.status.equals("Dismissed", ignoreCase = true)
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun CaseHeader(
    caseNumber: String,
    priorityLevel: String,
    isDismissed: Boolean
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
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
                .padding(16.dp)
        ) {
            Text(
                text = "Case: $caseNumber",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = WildWatchRed
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                PriorityBadge(priorityLevel = priorityLevel)
                if (isDismissed) {
                    Spacer(modifier = Modifier.width(8.dp))
                    DismissedBadge()
                }
            }
        }
    }
}

@Composable
private fun PriorityBadge(priorityLevel: String) {
    val (backgroundColor, textColor) = when (priorityLevel.uppercase()) {
        "HIGH" -> Color(0xFFDC2626) to Color.White
        "MEDIUM" -> Color(0xFFF59E0B) to Color.White
        else -> Color(0xFF10B981) to Color.White
    }

    Surface(
        color = backgroundColor,
        shape = MaterialTheme.shapes.small,
        modifier = Modifier.padding(end = 8.dp)
    ) {
        Text(
            text = priorityLevel,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            color = textColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun DismissedBadge() {
    Surface(
        color = Color.Gray,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = "Dismissed",
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            color = Color.White,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun ProgressTracker(status: String, isDismissed: Boolean) {
    data class Step(val label: String, val icon: ImageVector)
    val steps = listOf(
        Step("Submitted", Icons.Default.Schedule),
        Step("Reviewed", Icons.Default.Visibility),
        Step("In Progress", Icons.Default.Pending),
        Step("Resolved", Icons.Default.CheckCircle)
    ) + if (isDismissed) listOf(Step("Dismissed", Icons.Default.Cancel)) else emptyList()

    val currentStepIndex = when (status) {
        "Submitted" -> 0
        "Reviewed" -> 1
        "In Progress" -> 2
        "Resolved" -> 3
        "Dismissed" -> 4
        else -> 0
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
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
                .padding(16.dp)
        ) {
            Text(
                text = "Case Status",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = WildWatchRed
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                steps.forEachIndexed { index, step ->
                    val isCompleted = index < currentStepIndex
                    val isCurrent = index == currentStepIndex
                    val isUpcoming = index > currentStepIndex
                    val isDismissedStep = isDismissed && step.label == "Dismissed"

                    // Step circle with icon
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(36.dp)
                            .then(
                                if (isCurrent || isCompleted) Modifier.background(
                                    color = if (isDismissedStep) Color.Gray else WildWatchRed,
                                    shape = CircleShape
                                )
                                else Modifier.border(
                                    width = 2.dp,
                                    color = if (isDismissedStep) Color.Gray else WildWatchRed,
                                    shape = CircleShape
                                )
                            )
                    ) {
                        Icon(
                            imageVector = step.icon,
                            contentDescription = step.label,
                            tint = when {
                                isCurrent || isCompleted -> Color.White
                                isDismissedStep -> Color.White
                                else -> Color.Gray
                            },
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Draw connecting line except after last step
                    if (index < steps.size - 1) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(2.dp)
                                .background(
                                    color = if (isCompleted) WildWatchRed else Color.LightGray
                                )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Labels
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                steps.forEach { step ->
                    Text(
                        text = step.label,
                        style = MaterialTheme.typography.bodySmall,
                        color = WildWatchRed,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.widthIn(min = 60.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

@Composable
private fun DatesSection(
    submittedDate: String,
    lastUpdated: String,
    estimatedResolution: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            DateItem(label = "Submitted", date = submittedDate, icon = Icons.Default.CalendarToday)
            HorizontalDivider(
                modifier = Modifier
                    .height(36.dp)
                    .width(1.dp),
                color = Color.LightGray
            )
            DateItem(label = "Last Updated", date = lastUpdated, icon = Icons.Default.Update)
            HorizontalDivider(
                modifier = Modifier
                    .height(36.dp)
                    .width(1.dp),
                color = Color.LightGray
            )
            DateItem(label = "Est. Resolution", date = estimatedResolution, icon = Icons.Default.Event)
        }
    }
}

@Composable
private fun DateItem(label: String, date: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = WildWatchRed,
            modifier = Modifier.size(20.dp)
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray,
            textAlign = TextAlign.Center
        )

        Text(
            text = date,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun IncidentDetailsCard(
    incidentType: String,
    location: String,
    dateTime: String,
    description: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
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
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = WildWatchRed,
                    modifier = Modifier.size(24.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "Incident Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = WildWatchRed
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = Color.LightGray
            )

            DetailItem(
                label = "Incident Type",
                value = incidentType,
                icon = Icons.Default.Warning
            )

            DetailItem(
                label = "Location",
                value = location,
                icon = Icons.Default.LocationOn
            )

            DetailItem(
                label = "Date & Time",
                value = dateTime,
                icon = Icons.Default.Schedule
            )

            DetailItem(
                label = "Description",
                value = description,
                icon = Icons.Default.Description
            )
        }
    }
}

@Composable
private fun DetailItem(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null
) {
    Row(
        modifier = Modifier.padding(vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color.Gray,
                modifier = Modifier
                    .size(20.dp)
                    .padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.width(8.dp))
        }

        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )

            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun EvidenceCard(evidence: List<EvidenceDTO>) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
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
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.PhotoLibrary,
                    contentDescription = null,
                    tint = WildWatchRed,
                    modifier = Modifier.size(24.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "Submitted Evidence",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = WildWatchRed
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = Color.LightGray
            )

            if (evidence.isEmpty()) {
                Text(
                    text = "No evidence submitted for this case.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )
            } else {
                // Group evidence by type (images and documents)
                val images = evidence.filter { it.fileType.startsWith("image/") }
                val documents = evidence.filter { !it.fileType.startsWith("image/") }

                // Display images in a grid with fixed height
                if (images.isNotEmpty()) {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(240.dp) // Fixed height for the grid
                    ) {
                        items(images) { image ->
                            EvidenceItem(
                                title = image.fileName,
                                date = image.uploadedAt,
                                fileUrl = image.fileUrl,
                                isDocument = false
                            )
                        }
                    }
                }

                // Display documents
                if (documents.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        documents.forEach { document ->
                            EvidenceItem(
                                title = document.fileName,
                                date = document.uploadedAt,
                                fileUrl = document.fileUrl,
                                isDocument = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EvidenceItem(
    title: String,
    date: String,
    fileUrl: String,
    isDocument: Boolean = false,
    modifier: Modifier = Modifier
) {
    var showDialog by remember { mutableStateOf(false) }
    var pressed by remember { mutableStateOf(false) }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            confirmButton = {},
            dismissButton = {},
            text = {
                AsyncImage(
                    model = fileUrl,
                    contentDescription = title,
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1f),
                    contentScale = ContentScale.Fit
                )
            }
        )
    }

    Card(
        modifier = modifier
            .height(120.dp)
            .clickable { showDialog = true }
            .then(if (pressed) Modifier.shadow(8.dp) else Modifier)
            ,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Color.LightGray)
    ) {
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            if (isDocument) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFFF5F5F5)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.InsertDriveFile,
                        contentDescription = null,
                        tint = Color.Gray,
                        modifier = Modifier.size(36.dp)
                    )
                }
            } else {
                // Load and display the image using Coil
                AsyncImage(
                    model = fileUrl,
                    contentDescription = title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }

            // Overlay with just the date (no filename)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .background(Color.Black.copy(alpha = 0.6f))
                    .padding(8.dp)
            ) {
                Text(
                    text = date,
                    color = Color.White.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun CaseInformationCard(
    assignedTo: String,
    office: String,
    contactEmail: String,
    contactPhone: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
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
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Assignment,
                    contentDescription = null,
                    tint = WildWatchRed,
                    modifier = Modifier.size(24.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "Case Information",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = WildWatchRed
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = Color.LightGray
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFE0E0E0)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = Color.Gray
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = assignedTo,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )

                    Text(
                        text = "Assigned on ${office}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            DetailItem(
                label = "Office",
                value = office,
                icon = Icons.Default.Business
            )

            DetailItem(
                label = "Contact Email",
                value = contactEmail,
                icon = Icons.Default.Email
            )

            DetailItem(
                label = "Contact Phone",
                value = contactPhone,
                icon = Icons.Default.Phone
            )
        }
    }
}

@Composable
private fun ReporterInformationCard(
    name: String,
    email: String,
    phone: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
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
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = WildWatchRed,
                    modifier = Modifier.size(24.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "Reporter Information",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = WildWatchRed
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = Color.LightGray
            )

            DetailItem(
                label = "Name",
                value = name,
                icon = Icons.Default.Person
            )

            DetailItem(
                label = "Email",
                value = email,
                icon = Icons.Default.Email
            )

            DetailItem(
                label = "Phone",
                value = phone,
                icon = Icons.Default.Phone
            )
        }
    }
}

@Composable
private fun NextStepsCard(status: String, isDismissed: Boolean) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
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
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.PlaylistAddCheck,
                    contentDescription = null,
                    tint = WildWatchRed,
                    modifier = Modifier.size(24.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "Next Steps",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = WildWatchRed
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = Color.LightGray
            )

            if (isDismissed) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = Color.Gray
                    )
                    Text(
                        text = "This case has been dismissed. No further action will be taken.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray
                    )
                }
            } else {
                val steps = listOf(
                    Triple("Initial Review", "Case reviewed by security team", "Jan 2, 2024"),
                    Triple("Incident Updates", "Gathering security footage and witness statements", "Jan 3-4, 2024"),
                    Triple("In Progress", "Implementing security measures based on findings", "Jan 5-6, 2024"),
                    Triple("Case Resolution", "Final report and case closure", "Jan 7, 2024")
                )

                steps.forEachIndexed { index, (label, description, timeline) ->
                    val isCompleted = when (status) {
                        "Submitted" -> index == 0
                        "Reviewed" -> index <= 1
                        "In Progress" -> index <= 2
                        "Resolved" -> index <= 3
                        else -> false
                    }

                    val isCurrent = when (status) {
                        "Submitted" -> index == 0
                        "Reviewed" -> index == 1
                        "In Progress" -> index == 2
                        "Resolved" -> index == 3
                        else -> false
                    }

                    NextStepItem(
                        label = label,
                        description = description,
                        timeline = timeline,
                        isCompleted = isCompleted,
                        isCurrent = isCurrent
                    )

                    if (index < steps.size - 1) {
                        HorizontalDivider(
                            modifier = Modifier
                                .padding(vertical = 8.dp)
                                .padding(start = 28.dp),
                            color = Color.LightGray
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NextStepItem(
    label: String,
    description: String,
    timeline: String,
    isCompleted: Boolean,
    isCurrent: Boolean
) {
    Row(
        modifier = Modifier.padding(vertical = 4.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .background(
                    color = when {
                        isCompleted -> WildWatchRed
                        isCurrent -> WildWatchRed.copy(alpha = 0.7f)
                        else -> Color.Gray.copy(alpha = 0.3f)
                    },
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isCompleted) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = "Completed",
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            } else if (isCurrent) {
                Icon(
                    Icons.Default.Pending,
                    contentDescription = "In Progress",
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = if (isCompleted || isCurrent) WildWatchRed else Color.Gray
                )

                Text(
                    text = timeline,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
    }
}
