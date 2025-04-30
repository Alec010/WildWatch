package com.wildwatch.ui.screens.report

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.ui.theme.WildWatchRed
import java.text.SimpleDateFormat
import java.util.*
import android.widget.Toast
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.platform.LocalContext
import com.wildwatch.model.IncidentFormState
import com.wildwatch.viewmodel.IncidentFormViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import com.wildwatch.ui.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportIncidentScreen(
    onBackClick: () -> Unit = {},
    onContinueClick: () -> Unit = {},
    formViewModel: IncidentFormViewModel
) {
    val darkRed = WildWatchRed
    val backgroundColor = Color(0xFFF5F5F5)

    // Date picker state
    var showDatePicker by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = System.currentTimeMillis(),
        initialDisplayedMonthMillis = System.currentTimeMillis(),
        selectableDates = object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean {
                return utcTimeMillis <= System.currentTimeMillis() // Block future dates
            }
        }
    )

    // Time picker state
    var showTimePicker by remember { mutableStateOf(false) }
    val timePickerState = rememberTimePickerState()

    val context = LocalContext.current

    // After collecting formState properly:
    val formState by formViewModel.formState.collectAsState()

    // Define state holders (initialized blank)
    var incidentType by rememberSaveable { mutableStateOf("") }
    var incidentDate by rememberSaveable { mutableStateOf("") }
    var incidentTime by rememberSaveable { mutableStateOf("") }
    var location by rememberSaveable { mutableStateOf("") }
    var selectedOffice by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }

    // Sync values from ViewModel when formState changes
    LaunchedEffect(formState) {
        incidentType = formState.incidentType
        incidentDate = formState.dateOfIncident
        incidentTime = formState.timeOfIncident
        location = formState.location
        selectedOffice = formState.assignedOffice
        description = formState.description
    }

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
                    ProgressStep(number = 1, title = "Incident Details", isActive = true, isCompleted = false)

                    // Line between steps 1 and 2
                    HorizontalDivider(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp),
                        color = Color.Gray,
                        thickness = 1.dp
                    )

                    ProgressStep(number = 2, title = "Evidence & Witnesses", isActive = false, isCompleted = false)

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
                        // Header with warning icon
                        SectionHeader(
                            title = "Incident Details",
                            icon = Icons.Outlined.Warning,
                            color = darkRed
                        )

                        Text(
                            text = "Provide essential information about the incident",
                            color = Color.Gray,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 20.dp)
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
                            singleLine = true,
                            shape = RoundedCornerShape(8.dp)
                        )

                        // Date and Time Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
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
                                shape = RoundedCornerShape(8.dp),
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
                                shape = RoundedCornerShape(8.dp),
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
                                .padding(bottom = 20.dp),
                            singleLine = true,
                            shape = RoundedCornerShape(8.dp)
                        )

                        // Report to what Office
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 20.dp)
                        ) {
                            // Report to what Office header with gray background
                            Surface(
                                color = Color(0xFFF5F5F5),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "Report to what Office",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.padding(vertical = 12.dp, horizontal = 16.dp),
                                    softWrap = true,
                                    lineHeight = 20.sp
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // Office selection chips in a grid layout
                            val offices = listOf("TSG", "OPC", "MSDO", "Security", "PE", "IT", "HR", "Admin")

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
                                                fontSize = 12.sp,
                                                maxLines = 1,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                        },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = darkRed,
                                            selectedLabelColor = Color.White
                                        ),
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(16.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            // Second row
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
                                                fontSize = 12.sp,
                                                maxLines = 1,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                        },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = darkRed,
                                            selectedLabelColor = Color.White
                                        ),
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(16.dp)
                                    )
                                }
                                // Add empty spaces if needed to maintain alignment
                                repeat(4 - minOf(4, offices.size - 4)) {
                                    Spacer(modifier = Modifier.weight(1f))
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
                            maxLines = 10,
                            shape = RoundedCornerShape(8.dp)
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
                        FormNavigationButtons(
                            onBackClick = onBackClick,
                            onNextClick = {
                                if (
                                    incidentType.isBlank() ||
                                    incidentDate.isBlank() ||
                                    incidentTime.isBlank() ||
                                    location.isBlank() ||
                                    selectedOffice.isBlank() ||
                                    description.isBlank()
                                ) {
                                    Toast.makeText(
                                        context,
                                        "Please fill in all required fields before continuing.",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                    return@FormNavigationButtons
                                }

                                // Save form
                                formViewModel.updateFormState(
                                    formViewModel.formState.value.copy(
                                        incidentType = incidentType,
                                        dateOfIncident = incidentDate,
                                        timeOfIncident = incidentTime,
                                        location = location,
                                        assignedOffice = selectedOffice,
                                        description = description
                                    )
                                )
                                // Navigate
                                onContinueClick()
                            },
                            backText = "Cancel",
                            darkRed = darkRed
                        )
                    }
                }

                // Help section
                HelpPanel(
                    modifier = Modifier.fillMaxWidth(),
                    darkRed = darkRed
                )

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}
