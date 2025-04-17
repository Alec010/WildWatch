package com.wildwatch.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.ClickableText
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.wildwatch.R
import com.wildwatch.ui.components.auth.PasswordTextField

@Composable
fun SignUpScreen(
    onSignInClick: () -> Unit = {},
    onTermsClick: () -> Unit = {},
    onPrivacyClick: () -> Unit = {},
    navController: NavController // Accept navController here
) {
    var firstName by remember { mutableStateOf("") }
    var middleInitial by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("User Role") }
    var expanded by remember { mutableStateOf(false) }

    // Role options
    val roles = listOf("Student", "Researcher", "Faculty", "Administrator")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(40.dp))

        // Logo
        Image(
            painter = painterResource(id = R.drawable.logo),
            contentDescription = "WildWatch Logo",
            modifier = Modifier.size(125.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Create Account Text
        Text(
            text = "Create Account",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Name Fields Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // First Name
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text("First Name") },
                placeholder = { Text("Enter first name") },
                singleLine = true,
                modifier = Modifier.weight(1f)
            )

            // Middle Initial
            OutlinedTextField(
                value = middleInitial,
                onValueChange = { middleInitial = it },
                label = { Text("M.I.") },
                placeholder = { Text("M.I.") },
                singleLine = true,
                modifier = Modifier.width(80.dp)
            )

            // Last Name
            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text("Last Name") },
                placeholder = { Text("Enter last name") },
                singleLine = true,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Email Field
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Institutional Email") },
            placeholder = { Text("your.name@institution.edu") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Password Field
        PasswordTextField(
            value = password,
            onValueChange = { password = it },
            label = "Password",
            placeholder = "Create a secure password"
        )

        // Password requirements
        Text(
            text = "Password must be at least 8 characters with uppercase, number, and special character.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp, start = 16.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))


        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            roles.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        role = option
                        expanded = false
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Create Account Button - Simplified to just navigate back to sign in
        Button(
            onClick = { onSignInClick() },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text("Create Account")
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Already have an account
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            TextButton(onClick = {
                onSignInClick() // This will trigger the navigation back to LoginScreen
                navController.navigate("login") {
                    popUpTo("login") { inclusive = true }
                }
            }) {
                Text("Already have an account? Sign In")
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // Terms and Privacy
        val annotatedString = buildAnnotatedString {
            append("By creating an account, you agree to our ")

            pushStringAnnotation(tag = "terms", annotation = "terms")
            withStyle(style = SpanStyle(
                color = MaterialTheme.colorScheme.primary,
                textDecoration = TextDecoration.Underline
            )) {
                append("Terms of Service")
            }
            pop()

            append(" and ")

            pushStringAnnotation(tag = "privacy", annotation = "privacy")
            withStyle(style = SpanStyle(
                color = MaterialTheme.colorScheme.primary,
                textDecoration = TextDecoration.Underline
            )) {
                append("Privacy Policy")
            }
            pop()
        }

        ClickableText(
            text = annotatedString,
            style = MaterialTheme.typography.bodySmall.copy(
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            ),
            onClick = { offset ->
                annotatedString.getStringAnnotations(tag = "terms", start = offset, end = offset)
                    .firstOrNull()?.let { onTermsClick() }

                annotatedString.getStringAnnotations(tag = "privacy", start = offset, end = offset)
                    .firstOrNull()?.let { onPrivacyClick() }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 24.dp)
        )
    }
}

