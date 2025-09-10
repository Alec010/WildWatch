package com.wildwatch.ui.screens.report

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Info
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
import androidx.compose.ui.window.Dialog
import com.wildwatch.ui.theme.WildWatchRed
import java.text.SimpleDateFormat
import java.util.*
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.platform.LocalContext
import com.wildwatch.model.IncidentFormState
import com.wildwatch.repository.OfficeRepository
import com.wildwatch.viewmodel.IncidentFormViewModel
import com.wildwatch.ui.components.*
import com.wildwatch.utils.TokenManager
import com.wildwatch.viewmodel.OfficeViewModel
import com.wildwatch.viewmodel.OfficeViewModelFactory
import com.wildwatch.ui.components.TagGenerationSection

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportIncidentScreen(
    onBackClick: () -> Unit = {},
    onContinueClick: () -> Unit = {},
    formViewModel: IncidentFormViewModel,
    officeViewModel: OfficeViewModel = viewModel(factory = OfficeViewModelFactory(OfficeRepository())) // Pass repository to factory
) {
    val darkRed = WildWatchRed
    val backgroundColor = Color(0xFFF5F5F5)

    val context = LocalContext.current

    // Fetch the list of offices when the screen is loaded
    LaunchedEffect(context) {
        val token = TokenManager.getToken(context)
        Log.d("TokenManager", "Token: $token") // Add this log to see if the token is being retrieved
        if (token != null) {
            officeViewModel.fetchOffices(token) // Fetch offices from the backend
        } else {
            Toast.makeText(context, "Token is missing or expired", Toast.LENGTH_SHORT).show()
        }
    }

    // Observe the offices, loading, and error states from the ViewModel
    val offices by officeViewModel.offices.collectAsState()
    val loading by officeViewModel.loading.collectAsState()
    val error by officeViewModel.error.collectAsState()

    // State for showing office description dialog
    var showOfficeDescription by remember { mutableStateOf(false) }
    var selectedOfficeDetails by remember { mutableStateOf<Pair<String, String>?>(null) }

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

    // After collecting formState properly:
    val formState by formViewModel.formState.collectAsState()

    // Define state holders (initialized blank)
    var incidentType by rememberSaveable { mutableStateOf("") }
    var incidentDate by rememberSaveable { mutableStateOf("") }
    var incidentTime by rememberSaveable { mutableStateOf("") }
    var location by rememberSaveable { mutableStateOf("") }
    var selectedOffice by rememberSaveable { mutableStateOf<String?>(null) }
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

    // Update ViewModel when local state changes
    LaunchedEffect(incidentType, incidentDate, incidentTime, location, selectedOffice, description) {
        formViewModel.updateFormState(
            formState.copy(
                incidentType = incidentType,
                dateOfIncident = incidentDate,
                timeOfIncident = incidentTime,
                location = location,
                assignedOffice = selectedOffice,
                description = description
            )
        )
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

    // Office description dialog
    if (showOfficeDescription && selectedOfficeDetails != null) {
        Dialog(onDismissRequest = { showOfficeDescription = false }) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color.White
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = selectedOfficeDetails!!.first,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = darkRed
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = selectedOfficeDetails!!.second,
                        fontSize = 14.sp,
                        color = Color.DarkGray
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { showOfficeDescription = false },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = darkRed
                        ),
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Close")
                    }
                }
            }
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Incident Type", fontWeight = FontWeight.Bold)
                            Text(" *", color = darkRed, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = incidentType,
                            onValueChange = { incidentType = it },
                            label = null,
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
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("Date of Incident", fontWeight = FontWeight.Bold)
                                    Text(" *", color = darkRed, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = incidentDate,
                                    onValueChange = { incidentDate = it },
                                    label = null,
                                    placeholder = { Text("mm/dd/yyyy") },
                                    modifier = Modifier.fillMaxWidth(),
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
                            }

                            // Time of Incident
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("Time of Incident", fontWeight = FontWeight.Bold)
                                    Text(" *", color = darkRed, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = incidentTime,
                                    onValueChange = { incidentTime = it },
                                    label = null,
                                    placeholder = { Text("--:--") },
                                    modifier = Modifier.fillMaxWidth(),
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
                        }

                        // Location
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Location", fontWeight = FontWeight.Bold)
                            Text(" *", color = darkRed, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = location,
                            onValueChange = { location = it },
                            label = null,
                            placeholder = { Text("Be as specific as possible") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 20.dp),
                            singleLine = true,
                            shape = RoundedCornerShape(8.dp)
                        )

                        // Description
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Description", fontWeight = FontWeight.Bold)
                            Text(" *", color = darkRed, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = description,
                            onValueChange = {
                                if (it.length <= 1000) {
                                    description = it
                                }
                            },
                            label = null,
                            placeholder = { Text("Describe what happened in detail") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(150.dp)
                                .padding(bottom = 8.dp),
                            maxLines = 10,
                            shape = RoundedCornerShape(8.dp)
                        )

                        // Add this after the description TextField and before the character counter
                        TagGenerationSection(
                            description = description,
                            location = location,
                            viewModel = formViewModel,
                            modifier = Modifier.padding(vertical = 16.dp)
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
