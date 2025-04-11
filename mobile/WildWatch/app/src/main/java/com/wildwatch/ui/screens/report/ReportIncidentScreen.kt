package com.wildwatch.ui.screens.report

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Warning
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
import com.wildwatch.ui.theme.WildWatchRed
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportIncidentScreen(
    onBackClick: () -> Unit = {},
    onContinueClick: () -> Unit = {}
) {
    val darkRed = WildWatchRed

    // Form state
    var incidentType by remember { mutableStateOf("") }
    var incidentDate by remember { mutableStateOf("") }
    var incidentTime by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var selectedOffice by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    // Date picker state
    var showDatePicker by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState()

    // Time picker state
    var showTimePicker by remember { mutableStateOf(false) }
    val timePickerState = rememberTimePickerState()

    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val date = Date(millis)
                        val formatter = SimpleDateFormat("MM/dd/yyyy", Locale.getDefault())
                        incidentDate = formatter.format(date)
                    }
                    showDatePicker = false
                }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    if (showTimePicker) {
        TimePickerDialog(
            onDismissRequest = { showTimePicker = false },
            onConfirm = {
                val hour = timePickerState.hour
                val minute = timePickerState.minute
                val amPm = if (hour < 12) "AM" else "PM"
                val hour12 = if (hour == 0) 12 else if (hour > 12) hour - 12 else hour
                incidentTime = String.format("%02d:%02d %s", hour12, minute, amPm)
                showTimePicker = false
            }
        ) {
            TimePicker(state = timePickerState)
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar( // Changed to CenterAlignedTopAppBar
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
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                ProgressStep(number = 1, title = "Incident Details", isActive = true)

                // Line between steps 1 and 2
                Divider(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    color = Color.Gray,
                    thickness = 1.dp
                )

                ProgressStep(number = 2, title = "Evidence & Witnesses", isActive = false)

                // Line between steps 2 and 3
                Divider(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    color = Color.Gray,
                    thickness = 1.dp
                )

                ProgressStep(number = 3, title = "Review & Submit", isActive = false)
            }

            // Main form card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(8.dp),
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
                    // Header with warning icon
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(bottom = 16.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Warning,
                            contentDescription = null,
                            tint = darkRed,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Incident Details",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Text(
                        text = "Provide essential information about the incident",
                        color = Color.Gray,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )

                    // Incident Type
                    OutlinedTextField(
                        value = incidentType,
                        onValueChange = { incidentType = it },
                        label = {
                            Row {
                                Text("Incident Type")
                                Text(
                                    text = " *",
                                    color = darkRed
                                )
                            }
                        },
                        placeholder = { Text("Incident type") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp),
                        singleLine = true
                    )

                    // Date and Time Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Date of Incident
                        OutlinedTextField(
                            value = incidentDate,
                            onValueChange = { incidentDate = it },
                            label = {
                                Row {
                                    Text("Date of Incident")
                                    Text(
                                        text = " *",
                                        color = darkRed
                                    )
                                }
                            },
                            placeholder = { Text("mm/dd/yyyy") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { showDatePicker = true }) {
                                    Icon(
                                        imageVector = Icons.Default.CalendarToday,
                                        contentDescription = "Select date"
                                    )
                                }
                            }
                        )

                        // Time of Incident
                        OutlinedTextField(
                            value = incidentTime,
                            onValueChange = { incidentTime = it },
                            label = {
                                Row {
                                    Text("Time of Incident")
                                    Text(
                                        text = " *",
                                        color = darkRed
                                    )
                                }
                            },
                            placeholder = { Text("--:--") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { showTimePicker = true }) {
                                    Icon(
                                        imageVector = Icons.Default.Schedule,
                                        contentDescription = "Select time"
                                    )
                                }
                            }
                        )
                    }

                    // Location
                    OutlinedTextField(
                        value = location,
                        onValueChange = { location = it },
                        label = {
                            Row {
                                Text("Location")
                                Text(
                                    text = " *",
                                    color = darkRed
                                )
                            }
                        },
                        placeholder = { Text("Be as specific as possible") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp),
                        singleLine = true
                    )

                    // Report to what Office
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    ) {
                        // Report to what Office header with gray background - Fixed text display
                        Surface(
                            color = Color(0xFFF5F5F5),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Report to what Office",
                                fontSize = 16.sp,
                                modifier = Modifier.padding(vertical = 12.dp, horizontal = 16.dp),
                                softWrap = true, // Ensure text wraps properly
                                lineHeight = 20.sp // Increase line height to prevent cutting off
                            )
                        }

                        // Office selection chips in a grid layout
                        val offices = listOf("TSG", "OPC", "MSDO", "Security", "PE", "IT", "HR", "Admin")

                        // Simple approach with multiple rows
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // First row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                offices.take(4).forEach { office ->
                                    FilterChip(
                                        selected = selectedOffice == office,
                                        onClick = { selectedOffice = office },
                                        label = {
                                            Text(
                                                text = office,
                                                textAlign = TextAlign.Center,
                                                fontSize = 12.sp, // Smaller font size to fit better
                                                maxLines = 1, // Ensure single line
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                        },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = darkRed,
                                            selectedLabelColor = Color.White
                                        ),
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(16.dp) // Rounded corners
                                    )
                                }
                            }

                            // Second row (if needed)
                            if (offices.size > 4) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    offices.drop(4).take(4).forEach { office ->
                                        FilterChip(
                                            selected = selectedOffice == office,
                                            onClick = { selectedOffice = office },
                                            label = {
                                                Text(
                                                    text = office,
                                                    textAlign = TextAlign.Center,
                                                    fontSize = 12.sp, // Smaller font size to fit better
                                                    maxLines = 1, // Ensure single line
                                                    modifier = Modifier.fillMaxWidth()
                                                )
                                            },
                                            colors = FilterChipDefaults.filterChipColors(
                                                selectedContainerColor = darkRed,
                                                selectedLabelColor = Color.White
                                            ),
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(16.dp) // Rounded corners
                                        )
                                    }
                                    // Add empty spaces if needed to maintain alignment
                                    repeat(4 - minOf(4, offices.size - 4)) {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }

                    // Description
                    OutlinedTextField(
                        value = description,
                        onValueChange = {
                            if (it.length <= 1000) {
                                description = it
                            }
                        },
                        label = {
                            Row {
                                Text("Description")
                                Text(
                                    text = " *",
                                    color = darkRed
                                )
                            }
                        },
                        placeholder = { Text("Describe what happened in detail") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(150.dp)
                            .padding(bottom = 8.dp),
                        maxLines = 10
                    )

                    // Character counter
                    Text(
                        text = "${description.length}/1000 characters",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp),
                        textAlign = TextAlign.End
                    )

                    // Continue button
                    Button(
                        onClick = onContinueClick,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = darkRed
                        ),
                        modifier = Modifier
                            .align(Alignment.Start)
                            .padding(top = 8.dp)
                    ) {
                        Text("Continue to Evidence")
                        Icon(
                            imageVector = Icons.Default.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
            }

            // Help section
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(8.dp),
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
                    // Help header
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(darkRed)
                            .padding(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Help,
                            contentDescription = null,
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Need Help?",
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Reporting tips
                    Text(
                        text = "Reporting Tips",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    // Tips list
                    BulletPoint("Be as specific as possible about the location")
                    BulletPoint("Include time details even if approximate")
                    BulletPoint("Photos and videos help security respond effectively")
                    BulletPoint("Mention any witnesses who can provide additional information")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun ProgressStep(number: Int, title: String, isActive: Boolean) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Circle with number
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(if (isActive) WildWatchRed else Color.Gray)
                .padding(4.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = number.toString(),
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Step title
        Text(
            text = title,
            fontSize = 12.sp,
            color = if (isActive) Color.Black else Color.Gray,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun BulletPoint(text: String) {
    Row(
        modifier = Modifier.padding(bottom = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "•",
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(end = 8.dp, top = 2.dp)
        )
        Text(text = text)
    }
}

@Composable
fun TimePickerDialog(
    onDismissRequest: () -> Unit,
    onConfirm: () -> Unit,
    content: @Composable () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismissRequest,
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("OK")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismissRequest) {
                Text("Cancel")
            }
        },
        text = { content() }
    )
}
