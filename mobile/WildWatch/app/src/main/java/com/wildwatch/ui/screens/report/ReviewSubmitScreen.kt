package com.wildwatch.ui.screens.report

import android.content.Context
import android.net.Uri
import android.util.Log
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.model.IncidentFormState
import com.wildwatch.viewmodel.IncidentFormViewModel
import com.wildwatch.ui.components.*
import com.wildwatch.ui.theme.WildWatchRed
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewSubmitScreen(
    onBackClick: () -> Unit = {},
    onSubmitClick: () -> Unit = {},
    formViewModel: IncidentFormViewModel,
    isSubmitting: Boolean = false
) {
    val darkRed = WildWatchRed
    val backgroundColor = Color(0xFFF5F5F5)

    val context = LocalContext.current
    val formState by formViewModel.formState.collectAsState()
    val errorMessage by formViewModel.errorMessage.collectAsState()

    // Editing states
    var isEditingIncidentDetails by remember { mutableStateOf(false) }

    // Editable fields
    var editableIncidentType by remember { mutableStateOf(formState.incidentType) }
    var editableDateOfIncident by remember { mutableStateOf(formState.dateOfIncident) }
    var editableTimeOfIncident by remember { mutableStateOf(formState.timeOfIncident) }
    var editableLocation by remember { mutableStateOf(formState.location) }
    var editableDescription by remember { mutableStateOf(formState.description) }

    // Confirmation checkboxes
    var confirmAccurate by remember { mutableStateOf(false) }
    var confirmContact by remember { mutableStateOf(false) }

    // Date and time pickers
    var showDatePicker by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = System.currentTimeMillis(),
        initialDisplayedMonthMillis = System.currentTimeMillis(),
        selectableDates = object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean {
                return utcTimeMillis <= System.currentTimeMillis() // Disallow future dates
            }
        }
    )

    var showTimePicker by remember { mutableStateOf(false) }
    val timePickerState = rememberTimePickerState()

    // Error dialog state
    var showErrorDialog by remember { mutableStateOf(false) }
    var errorDialogMessage by remember { mutableStateOf("") }

    // Update editable fields when formState changes
    LaunchedEffect(formState) {
        editableIncidentType = formState.incidentType
        editableDateOfIncident = formState.dateOfIncident
        editableTimeOfIncident = formState.timeOfIncident
        editableLocation = formState.location
        editableDescription = formState.description
    }

    // Handle error messages from ViewModel
    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            errorDialogMessage = it
            showErrorDialog = true
            formViewModel.clearError()
        }
    }

    // Error dialog
    if (showErrorDialog) {
        AlertDialog(
            onDismissRequest = { showErrorDialog = false },
            title = { Text("Error") },
            text = { Text(errorDialogMessage) },
            confirmButton = {
                TextButton(onClick = { showErrorDialog = false }) {
                    Text("OK")
                }
            },
            containerColor = Color.White,
            titleContentColor = darkRed
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

                    ProgressStep(number = 2, title = "Evidence & Witnesses", isActive = false, isCompleted = true)

                    // Line between steps 2 and 3
                    HorizontalDivider(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp),
                        color = darkRed,
                        thickness = 1.dp
                    )

                    ProgressStep(number = 3, title = "Review & Submit", isActive = true, isCompleted = false)
                }
            }

            // Main content
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                // Review & Submit Header Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    shape = RoundedCornerShape(16.dp),
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = darkRed,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Review & Submit",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = darkRed
                            )
                        }

                        Text(
                            text = "Review your report details before submission",
                            color = Color.Gray,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }
                }

                // Incident Details Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    shape = RoundedCornerShape(16.dp),
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
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = darkRed,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Incident Details",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = darkRed
                                )
                            }

                            IconButton(
                                onClick = {
                                    editableIncidentType = formState.incidentType
                                    editableDateOfIncident = formState.dateOfIncident
                                    editableTimeOfIncident = formState.timeOfIncident
                                    editableLocation = formState.location
                                    editableDescription = formState.description
                                    isEditingIncidentDetails = true
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Edit,
                                    contentDescription = "Edit incident details",
                                    tint = darkRed,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        if (isEditingIncidentDetails) {
                            // Editable fields
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Incident Details",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )

                                    TextButton(
                                        onClick = {
                                            // Reset to original values
                                            editableIncidentType = formState.incidentType
                                            editableDateOfIncident = formState.dateOfIncident
                                            editableTimeOfIncident = formState.timeOfIncident
                                            editableLocation = formState.location
                                            editableDescription = formState.description
                                            isEditingIncidentDetails = false
                                        },
                                        colors = ButtonDefaults.textButtonColors(
                                            contentColor = Color.Gray
                                        )
                                    ) {
                                        Text("Cancel")
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                OutlinedTextField(
                                    value = editableIncidentType,
                                    onValueChange = { editableIncidentType = it },
                                    label = { Text("Incident Type") },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 12.dp),
                                    shape = RoundedCornerShape(8.dp)
                                )

                                // Date Field
                                OutlinedTextField(
                                    value = editableDateOfIncident,
                                    onValueChange = { /* Disable manual typing */ },
                                    label = { Text("Date of Incident") },
                                    readOnly = true,
                                    trailingIcon = {
                                        IconButton(onClick = { showDatePicker = true }) {
                                            Icon(Icons.Default.CalendarToday, contentDescription = "Select date")
                                        }
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 12.dp),
                                    shape = RoundedCornerShape(8.dp)
                                )

                                if (showDatePicker) {
                                    DatePickerDialog(
                                        onDismissRequest = { showDatePicker = false },
                                        confirmButton = {
                                            TextButton(onClick = {
                                                datePickerState.selectedDateMillis?.let { millis ->
                                                    val date = Date(millis)
                                                    val formatter = SimpleDateFormat("MM/dd/yyyy", Locale.getDefault())
                                                    editableDateOfIncident = formatter.format(date)
                                                }
                                                showDatePicker = false
                                            }) { Text("OK") }
                                        },
                                        dismissButton = {
                                            TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
                                        }
                                    ) {
                                        DatePicker(state = datePickerState)
                                    }
                                }

                                // Time Field
                                OutlinedTextField(
                                    value = editableTimeOfIncident,
                                    onValueChange = { /* Disable manual typing */ },
                                    label = { Text("Time of Incident") },
                                    readOnly = true,
                                    trailingIcon = {
                                        IconButton(onClick = { showTimePicker = true }) {
                                            Icon(Icons.Default.Schedule, contentDescription = "Select time")
                                        }
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 12.dp),
                                    shape = RoundedCornerShape(8.dp)
                                )

                                if (showTimePicker) {
                                    TimePickerDialog(
                                        onDismissRequest = { showTimePicker = false },
                                        onConfirm = {
                                            val hour = timePickerState.hour
                                            val minute = timePickerState.minute
                                            val amPm = if (hour < 12) "AM" else "PM"
                                            val hour12 = if (hour == 0) 12 else if (hour > 12) hour - 12 else hour
                                            editableTimeOfIncident = String.format("%02d:%02d %s", hour12, minute, amPm)
                                            showTimePicker = false
                                        }
                                    ) {
                                        TimePicker(state = timePickerState)
                                    }
                                }

                                OutlinedTextField(
                                    value = editableLocation,
                                    onValueChange = { editableLocation = it },
                                    label = { Text("Location") },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 12.dp),
                                    shape = RoundedCornerShape(8.dp)
                                )

                                OutlinedTextField(
                                    value = editableDescription,
                                    onValueChange = { editableDescription = it },
                                    label = { Text("Description") },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(120.dp)
                                        .padding(bottom = 12.dp),
                                    shape = RoundedCornerShape(8.dp)
                                )

                                Button(
                                    onClick = {
                                        // Validate inputs
                                        if (editableIncidentType.isBlank() ||
                                            editableDateOfIncident.isBlank() ||
                                            editableTimeOfIncident.isBlank() ||
                                            editableLocation.isBlank() ||
                                            editableDescription.isBlank()) {

                                            Toast.makeText(context, "All fields are required", Toast.LENGTH_SHORT).show()
                                            return@Button
                                        }

                                        try {
                                            // Update the form state
                                            formViewModel.updateFormState(
                                                formViewModel.formState.value.copy(
                                                    incidentType = editableIncidentType,
                                                    dateOfIncident = editableDateOfIncident,
                                                    timeOfIncident = editableTimeOfIncident,
                                                    location = editableLocation,
                                                    description = editableDescription
                                                )
                                            )
                                            isEditingIncidentDetails = false

                                            // Log the update
                                            Log.d("ReviewSubmitScreen", "Updated incident details")
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Invalid input. Please check your entries.", Toast.LENGTH_SHORT).show()
                                            Log.e("ReviewSubmitScreen", "Error updating incident details", e)
                                        }
                                    },
                                    enabled = !isSubmitting,
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = darkRed)
                                ) {
                                    if (isSubmitting) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(20.dp),
                                            strokeWidth = 2.dp,
                                            color = Color.White
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Submitting...")
                                    } else {
                                        Text("Save Changes")
                                    }
                                }
                            }
                        } else {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 12.dp)
                            ) {
                                DetailRow("Incident Type", formState.incidentType)
                                DetailRow("Date & Time", "${formState.dateOfIncident} - ${formState.timeOfIncident}")
                                DetailRow("Location", formState.location)
                                DetailRow(
                                    "Description",
                                    formState.description,
                                    isMultiLine = true
                                )
                            }
                        }
                    }
                }

                // Evidence & Witnesses Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    shape = RoundedCornerShape(16.dp),
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
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Assignment,
                                    contentDescription = null,
                                    tint = darkRed,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Evidence & Witnesses",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = darkRed
                                )
                            }

                            IconButton(
                                onClick = onBackClick
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Edit,
                                    contentDescription = "Edit evidence and witnesses",
                                    tint = darkRed,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        // Uploaded Evidence
                        Text(
                            text = "Uploaded Evidence",
                            fontWeight = FontWeight.Medium,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(top = 12.dp, bottom = 8.dp)
                        )

                        if (formState.evidenceUris.isEmpty()) {
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
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(100.dp)
                                    .border(width = 1.dp, color = Color.LightGray, shape = RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                LazyRow(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(horizontal = 12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    items(formState.evidenceUris) { uriString ->
                                        val uri = Uri.parse(uriString)
                                        val filename = uri.lastPathSegment?.substringAfterLast('/') ?: "image.jpg"
                                        ImageThumbnail(
                                            filename = filename,
                                            imageUri = uri
                                        )
                                    }
                                }
                            }
                        }

                        // Witness Information
                        Text(
                            text = "Witness Information",
                            fontWeight = FontWeight.Medium,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(top = 8.dp, bottom = 8.dp)
                        )

                        if (formState.witnesses.isEmpty()) {
                            Text(
                                text = "No witnesses provided",
                                color = Color.Gray,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(bottom = 16.dp)
                            )
                        } else {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 16.dp)
                            ) {
                                formState.witnesses.forEach { witness ->
                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(bottom = 8.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = Color(0xFFF9F9F9)
                                        )
                                    ) {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(12.dp)
                                        ) {
                                            Text(
                                                text = "Name: ${witness.name}",
                                                fontWeight = FontWeight.Medium,
                                                fontSize = 14.sp
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = "Contact: ${witness.contactInformation}",
                                                fontSize = 14.sp,
                                                color = Color.DarkGray
                                            )
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(
                                                text = "Additional Notes: ${witness.additionalNotes}",
                                                fontSize = 14.sp,
                                                color = Color.DarkGray
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Confirmation Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    shape = RoundedCornerShape(16.dp),
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = darkRed,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Confirmation",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = darkRed
                            )
                        }

                        // Notification message
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color(0xFFE6F7FF)
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = null,
                                    tint = Color(0xFF0070F3),
                                    modifier = Modifier.padding(end = 12.dp)
                                )
                                Text(
                                    text = "Your report will be reviewed by campus security personnel. You will receive a confirmation email with a tracking number once your report is submitted.",
                                    fontSize = 14.sp,
                                    color = Color.DarkGray
                                )
                            }
                        }

                        // Confirmation checkboxes
                        ConfirmationCheck(
                            label = "I confirm that all information provided is accurate to the best of my knowledge.",
                            checked = confirmAccurate,
                            onCheckedChange = { confirmAccurate = it },
                            darkRed = darkRed
                        )

                        ConfirmationCheck(
                            label = "I understand that campus security may contact me for additional information.",
                            checked = confirmContact,
                            onCheckedChange = { confirmContact = it },
                            darkRed = darkRed
                        )
                    }
                }

                // Navigation buttons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    OutlinedButton(
                        onClick = onBackClick,
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = darkRed
                        ),
                        border = BorderStroke(1.dp, darkRed),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = null,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text("Back")
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Button(
                        onClick = {
                            if (!validateForm(formState, confirmAccurate, confirmContact, context)) {
                                return@Button
                            }
                            onSubmitClick()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = darkRed
                        ),
                        shape = RoundedCornerShape(8.dp),
                        enabled = confirmAccurate && confirmContact && !isSubmitting,
                        modifier = Modifier.weight(1f)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Submitting...")
                        } else {
                            Text("Submit Report")
                            Icon(
                                imageVector = Icons.Default.Send,
                                contentDescription = null,
                                modifier = Modifier.padding(start = 8.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }

            // Help panel
            HelpPanel(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                darkRed = darkRed
            )
        }
    }
}

/**
 * Validates the form before submission
 */
private fun validateForm(
    formState: IncidentFormState,
    confirmAccurate: Boolean,
    confirmContact: Boolean,
    context: Context
): Boolean {
    // Check if all required fields are filled
    if (formState.incidentType.isBlank() ||
        formState.dateOfIncident.isBlank() ||
        formState.timeOfIncident.isBlank() ||
        formState.location.isBlank() ||
        formState.description.isBlank()) {

        Toast.makeText(context, "Please fill in all required fields.", Toast.LENGTH_SHORT).show()
        return false
    }

    // Check if confirmation checkboxes are checked
    if (!confirmAccurate || !confirmContact) {
        Toast.makeText(context, "Please confirm all checkboxes.", Toast.LENGTH_SHORT).show()
        return false
    }

    return true
}
