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


    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(40.dp))

        // Logo - using the existing logo resource
        Image(
            painter = painterResource(id = R.drawable.logo),
            contentDescription = "WildWatch Logo",
            modifier = Modifier.size(120.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Create Account Text
        Text(
            text = "Create Account",
            fontSize = 24.sp,
            color = WildWatchRed,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Form fields with proper alignment
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // First Name, M.I., Last Name labels
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

            // First Name, M.I., Last Name fields
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    placeholder = { Text("Enter first name", fontSize = 14.sp) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color.LightGray,
                        focusedBorderColor = WildWatchRed
                    )
                )

                OutlinedTextField(
                    value = middleInitial,
                    onValueChange = { middleInitial = it },
                    placeholder = { Text("M.I.", fontSize = 14.sp) },
                    singleLine = true,
                    modifier = Modifier.width(60.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color.LightGray,
                        focusedBorderColor = WildWatchRed
                    )
                )

                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    placeholder = { Text("Enter last name", fontSize = 14.sp) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color.LightGray,
                        focusedBorderColor = WildWatchRed
                    )
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Institutional Email
            Text(
                text = "Institutional Email",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                placeholder = { Text("your.name@institution.edu", fontSize = 14.sp) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color.LightGray,
                    focusedBorderColor = WildWatchRed
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // School ID - Added below email
            Text(
                text = "School ID",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = schoolId,
                onValueChange = { schoolId = it },
                placeholder = { Text("Enter your school ID", fontSize = 14.sp) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color.LightGray,
                    focusedBorderColor = WildWatchRed
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Password
            Text(
                text = "Password",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

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
                            tint = Color.Gray
                        )
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .onFocusChanged {
                        // When focus changes, update the focus state
                        passwordFieldFocused = it.isFocused
                        // If losing focus, hide the password
                        if (!it.isFocused && passwordVisible) {
                            passwordVisible = false
                        }
                    },
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color.LightGray,
                    focusedBorderColor = WildWatchRed
                )
            )

            // Password requirements
            Text(
                text = "Password must be at least 8 characters with uppercase, number, and special character.",
                fontSize = 12.sp,
                color = Color.Gray,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Confirm Password
            Text(
                text = "Confirm Password",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

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
                            tint = Color.Gray
                        )
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .onFocusChanged {
                        // When focus changes, update the focus state
                        confirmPasswordFieldFocused = it.isFocused
                        // If losing focus, hide the password
                        if (!it.isFocused && confirmPasswordVisible) {
                            confirmPasswordVisible = false
                        }
                    },
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color.LightGray,
                    focusedBorderColor = WildWatchRed
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Contact Number
            Text(
                text = "Contact Number",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = contactNumber,
                onValueChange = { contactNumber = it },
                placeholder = { Text("Contact Number", fontSize = 14.sp) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color.LightGray,
                    focusedBorderColor = WildWatchRed
                )
            )

            Spacer(modifier = Modifier.height(24.dp))

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
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = WildWatchRed
                ),
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = "Create Account",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

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
                        fontWeight = FontWeight.Medium,
                        fontSize = 14.sp
                    )
                }
            }

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
                    withStyle(style = SpanStyle(
                        color = WildWatchRed
                    )) {
                        append("Terms of Service")
                    }
                    pop()

                    append(" and ")

                    pushStringAnnotation(tag = "privacy", annotation = "privacy")
                    withStyle(style = SpanStyle(
                        color = WildWatchRed
                    )) {
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
                            .firstOrNull()?.let { onTermsClick() }

                        annotatedString.getStringAnnotations(tag = "privacy", start = offset, end = offset)
                            .firstOrNull()?.let { onPrivacyClick() }
                    },
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
