package com.wildwatch.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.ClickableText
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.R
import com.wildwatch.ui.theme.WildWatchRed
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.platform.LocalContext
import com.wildwatch.viewmodel.RegisterViewModel
import com.wildwatch.model.RegisterRequest
import android.widget.Toast
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.material3.AlertDialog
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.foundation.shape.RoundedCornerShape

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignUpScreen(
    onSignInClick: () -> Unit = {},
    onTermsClick: () -> Unit = {},
    onPrivacyClick: () -> Unit = {}
) {
    var firstName by remember { mutableStateOf("") }
    var middleInitial by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var schoolId by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var contactNumber by remember { mutableStateOf("") }
    var agreeToTerms by remember { mutableStateOf(false) }

    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }

    // Focus states to track when fields lose focus
    var passwordFieldFocused by remember { mutableStateOf(false) }
    var confirmPasswordFieldFocused by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val viewModel: RegisterViewModel = viewModel()
    val registerResult by viewModel.registerResult.collectAsStateWithLifecycle()

    var showTermsDialog by remember { mutableStateOf(false) }

    var isFormVisible by remember { mutableStateOf(false) }
    val logoAlpha by animateFloatAsState(
        targetValue = if (isFormVisible) 1f else 0f,
        animationSpec = tween(durationMillis = 1000)
    )
    val screenHeight = with(LocalDensity.current) {
        LocalContext.current.resources.displayMetrics.heightPixels / density
    }
    val topPadding = 24.dp
    val logoSize = 120.dp

    LaunchedEffect(Unit) {
        // Animate form visibility after a short delay
        kotlinx.coroutines.delay(300)
        isFormVisible = true
    }

    LaunchedEffect(registerResult) {
        registerResult?.let { result ->
            result.onSuccess {
                Toast.makeText(context, "Registration successful!", Toast.LENGTH_SHORT).show()
                onSignInClick() // or navigate to login screen
            }.onFailure {
                Toast.makeText(context, "Registration failed: ${it.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    // Helper function to format school ID as 00-0000-000
    fun formatSchoolId(input: String): String {
        val digits = input.filter { it.isDigit() }
        return when {
            digits.length <= 2 -> digits
            digits.length <= 6 -> "${digits.take(2)}-${digits.drop(2)}"
            digits.length <= 9 -> "${digits.take(2)}-${digits.drop(2).take(4)}-${digits.drop(6)}"
            else -> "${digits.take(2)}-${digits.drop(2).take(4)}-${digits.drop(6).take(3)}"
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.surface,
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .wrapContentWidth(Alignment.CenterHorizontally),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(topPadding))
            // Logo with animation
            Box(
                modifier = Modifier
                    .size(logoSize)
                    .clip(MaterialTheme.shapes.medium)
                    .alpha(logoAlpha)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.logo),
                    contentDescription = "WildWatch Logo",
                    modifier = Modifier.fillMaxSize(),
                    alignment = Alignment.Center
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            // Title with animation
            AnimatedVisibility(
                visible = isFormVisible,
                enter = fadeIn(animationSpec = tween(1000)) +
                        slideInVertically(
                            animationSpec = tween(1000),
                            initialOffsetY = { it / 2 }
                        )
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Create Account",
                        fontSize = 24.sp,
                        color = WildWatchRed,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Fill in your details to join WildWatch",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
                    )
                }
            }
            // Form with animation
            AnimatedVisibility(
                visible = isFormVisible,
                enter = fadeIn(animationSpec = tween(1200)) +
                        slideInVertically(
                            animationSpec = tween(1200),
                            initialOffsetY = { it / 2 }
                        )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .widthIn(max = 400.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // First Name, M.I., Last Name labels and fields
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Start
                    ) {
                        Text(
                            text = "First Name",
                            modifier = Modifier.weight(1f),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "M.I.",
                            modifier = Modifier.width(60.dp),
                            textAlign = TextAlign.Start,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Last Name",
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Start,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = firstName,
                            onValueChange = { firstName = it },
                            placeholder = { Text("First name", fontSize = 14.sp) },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = MaterialTheme.shapes.medium,
                            colors = OutlinedTextFieldDefaults.colors(
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                                focusedBorderColor = WildWatchRed
                            )
                        )
                        OutlinedTextField(
                            value = middleInitial,
                            onValueChange = { middleInitial = it },
                            placeholder = { Text("M.I.", fontSize = 14.sp) },
                            singleLine = true,
                            modifier = Modifier.width(60.dp),
                            shape = MaterialTheme.shapes.medium,
                            colors = OutlinedTextFieldDefaults.colors(
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                                focusedBorderColor = WildWatchRed
                            )
                        )
                        OutlinedTextField(
                            value = lastName,
                            onValueChange = { lastName = it },
                            placeholder = { Text("Last name", fontSize = 14.sp) },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = MaterialTheme.shapes.medium,
                            colors = OutlinedTextFieldDefaults.colors(
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                                focusedBorderColor = WildWatchRed
                            )
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    // Email
                    Text(
                        text = "Institutional Email",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        placeholder = { Text("your.name@institution.edu", fontSize = 14.sp) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedBorderColor = WildWatchRed
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    // School ID
                    Text(
                        text = "School ID",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = schoolId,
                        onValueChange = { schoolId = formatSchoolId(it) },
                        placeholder = { Text("Enter your school ID", fontSize = 14.sp) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedBorderColor = WildWatchRed
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    // Password
                    Text(
                        text = "Password",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        placeholder = { Text("Create a secure password", fontSize = 14.sp) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = if (passwordVisible) "Hide password" else "Show password",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .onFocusChanged {
                                passwordFieldFocused = it.isFocused
                                if (!it.isFocused && passwordVisible) {
                                    passwordVisible = false
                                }
                            },
                        shape = MaterialTheme.shapes.medium,
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedBorderColor = WildWatchRed
                        )
                    )
                    Text(
                        text = "Password must be at least 8 characters with uppercase, number, and special character.",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    // Confirm Password
                    Text(
                        text = "Confirm Password",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        placeholder = { Text("Confirm password", fontSize = 14.sp) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { confirmPasswordVisible = !confirmPasswordVisible }) {
                                Icon(
                                    imageVector = if (confirmPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = if (confirmPasswordVisible) "Hide password" else "Show password",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .onFocusChanged {
                                confirmPasswordFieldFocused = it.isFocused
                                if (!it.isFocused && confirmPasswordVisible) {
                                    confirmPasswordVisible = false
                                }
                            },
                        shape = MaterialTheme.shapes.medium,
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedBorderColor = WildWatchRed
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    // Contact Number
                    Text(
                        text = "Contact Number",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = contactNumber,
                        onValueChange = { contactNumber = it },
                        placeholder = { Text("Contact Number", fontSize = 14.sp) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedBorderColor = WildWatchRed
                        )
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    // Terms and Privacy Checkbox
                    Row(
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.Start,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Checkbox(
                            checked = agreeToTerms,
                            onCheckedChange = { agreeToTerms = it },
                            colors = CheckboxDefaults.colors(
                                checkedColor = WildWatchRed,
                                uncheckedColor = Color.Gray
                            ),
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        val annotatedString = buildAnnotatedString {
                            append("By creating an account, you agree to our ")
                            pushStringAnnotation(tag = "terms", annotation = "terms")
                            withStyle(style = SpanStyle(color = WildWatchRed, fontWeight = FontWeight.Bold)) {
                                append("Terms of Service")
                            }
                            pop()
                            append(" and ")
                            pushStringAnnotation(tag = "privacy", annotation = "privacy")
                            withStyle(style = SpanStyle(color = WildWatchRed, fontWeight = FontWeight.Bold)) {
                                append("Privacy Policy")
                            }
                            pop()
                        }
                        ClickableText(
                            text = annotatedString,
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Color.DarkGray,
                                fontSize = 12.sp
                            ),
                            onClick = { offset ->
                                annotatedString.getStringAnnotations(tag = "terms", start = offset, end = offset)
                                    .firstOrNull()?.let { showTermsDialog = true }
                                annotatedString.getStringAnnotations(tag = "privacy", start = offset, end = offset)
                                    .firstOrNull()?.let { onPrivacyClick() }
                            },
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                    if (showTermsDialog) {
                        AlertDialog(
                            onDismissRequest = { showTermsDialog = false },
                            title = { Text("Terms of Service", color = WildWatchRed, fontWeight = FontWeight.Bold) },
                            text = {
                                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                                    Text(
                                        "Effective Date: April 08, 2025\n\n" +
                                        "Welcome to WildWatch, the official incident reporting and case management platform of Cebu Institute of Technology – University (CITU). By accessing or using the WildWatch website and application (the 'Platform'), you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully.\n\n" +
                                        "1. Use of the Platform\nWildWatch is intended to facilitate the structured reporting, tracking, and resolution of campus-related incidents within CITU. Use of this platform must be in accordance with university policies, applicable laws, and ethical conduct.\n\n" +
                                        "2. User Responsibilities\n- Maintain the confidentiality of your account credentials\n- Report incidents truthfully and in good faith\n- Respect the privacy and rights of others involved in reported incidents\n- Use the platform responsibly and not for any malicious purposes\n- Keep your contact information updated\n\n" +
                                        "3. Privacy and Data Protection\n- Your personal information will be handled in accordance with our Privacy Policy\n- Incident reports and related information will be treated with appropriate confidentiality\n- Access to incident details will be restricted to authorized personnel only\n\n" +
                                        "4. Platform Rules\nUsers must NOT:\n- Submit false or malicious reports\n- Harass or intimidate other users\n- Share confidential information about incidents publicly\n- Attempt to compromise the platform's security\n- Use the platform for any illegal activities\n\n" +
                                        "5. Consequences of Violation\nViolation of these terms may result in:\n- Temporary or permanent account suspension\n- Disciplinary action under university policies\n- Legal action in severe cases\n\n" +
                                        "6. Changes to Terms\nCITU reserves the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the platform constitutes acceptance of modified terms.\n\n" +
                                        "7. Contact Information\nFor questions about these terms or the platform, contact the CITU Security Office or IT Department.",
                                        fontSize = 12.sp,
                                        color = Color.DarkGray
                                    )
                                }
                            },
                            confirmButton = {
                                TextButton(onClick = {
                                    agreeToTerms = true
                                    showTermsDialog = false
                                }) {
                                    Text("Accept Terms", color = WildWatchRed, fontWeight = FontWeight.Bold)
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { showTermsDialog = false }) {
                                    Text("Close")
                                }
                            }
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    // Create Account Button
                    Button(
                        onClick = onCreateClick@{
                            if (!agreeToTerms) {
                                Toast.makeText(context, "Please agree to the Terms & Privacy Policy", Toast.LENGTH_SHORT).show()
                                return@onCreateClick
                            }
                            if (password != confirmPassword) {
                                Toast.makeText(context, "Passwords do not match", Toast.LENGTH_SHORT).show()
                                return@onCreateClick
                            }
                            val request = RegisterRequest(
                                firstName = firstName,
                                lastName = lastName,
                                middleInitial = middleInitial,
                                email = email,
                                schoolIdNumber = schoolId,
                                password = password,
                                confirmPassword = confirmPassword,
                                contactNumber = contactNumber,
                                termsAccepted = agreeToTerms
                            )
                            viewModel.register(request)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = WildWatchRed
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "Create Account",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    // Already have an account
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Already have an account? ",
                            fontSize = 14.sp
                        )
                        TextButton(
                            onClick = { onSignInClick() },
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text(
                                text = "Sign in",
                                color = WildWatchRed,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
