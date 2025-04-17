package com.wildwatch.ui.screens

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.wildwatch.R
import com.wildwatch.ui.components.auth.PasswordTextField
import com.wildwatch.viewmodel.LoginViewModel

@Composable
fun LoginScreen(
    onLoginClick: (String, String) -> Unit = { _, _ -> },
    onForgotPasswordClick: () -> Unit = {},
    onOutlookLoginClick: () -> Unit = {},
    onCreateAccountClick: () -> Unit = {},
    navController: NavController
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf(false) }
    var passwordError by remember { mutableStateOf(false) }

    val viewModel: LoginViewModel = viewModel()
    val context = LocalContext.current
    val loginResult by viewModel.loginResult.collectAsState()

    LaunchedEffect(loginResult) {
        loginResult?.let { result ->
            result.onSuccess { response ->
                Toast.makeText(context, "Login successful!", Toast.LENGTH_SHORT).show()
                if (response.termsAccepted) {
                    navController.navigate("main") {
                        popUpTo("login") { inclusive = true }
                    }
                } else {
                    navController.navigate("terms") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            }.onFailure {
                Toast.makeText(context, "Login failed: ${it.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(48.dp))

        Image(
            painter = painterResource(id = R.drawable.logo),
            contentDescription = "WildWatch Logo",
            modifier = Modifier.size(125.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Sign In",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = {
                email = it
                emailError = false
            },
            label = { Text("Institutional Email") },
            placeholder = { Text("your.name@institution.edu") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            isError = emailError,
            supportingText = {
                if (emailError) {
                    Text(
                        text = "Please enter a valid email",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        PasswordTextField(
            value = password,
            onValueChange = {
                password = it
                passwordError = false
            },
            label = "Password",
            placeholder = "Enter your password",
            isError = passwordError,
            errorMessage = "Password is required"
        )

        Box(modifier = Modifier.fillMaxWidth()) {
            TextButton(
                onClick = { onForgotPasswordClick() },
                modifier = Modifier.align(Alignment.CenterEnd)
            ) {
                Text(
                    text = "Forgot Password?",
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                emailError = email.isEmpty() || !email.contains("@")
                passwordError = password.isEmpty()

                if (!emailError && !passwordError) {
                    viewModel.login(email, password)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            Text("Sign In")
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "OR",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedButton(
            onClick = { onOutlookLoginClick() },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            Text("Sign in with Outlook")
        }

        Spacer(modifier = Modifier.weight(1f))

        Text(
            text = "Note: When signing in with Outlook, additional credentials may be required after authentication.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(bottom = 24.dp)
        )

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.padding(bottom = 24.dp)
        ) {
            Text(
                text = "Don't have an account? ",
                style = MaterialTheme.typography.bodyMedium
            )

            TextButton(onClick = { onCreateAccountClick() }) {
                Text("Create Account")
            }
        }
    }
}
