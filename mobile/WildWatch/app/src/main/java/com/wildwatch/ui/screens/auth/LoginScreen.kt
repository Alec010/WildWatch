package com.wildwatch.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.wildwatch.R
import com.wildwatch.ui.components.auth.PasswordTextField
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.utils.MicrosoftAuth
import com.wildwatch.utils.TokenManager
import com.wildwatch.viewmodel.LoginViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.ui.graphics.SolidColor

@OptIn(ExperimentalComposeUiApi::class, ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginClick: (String, String) -> Unit = { _, _ -> },
    onForgotPasswordClick: () -> Unit = {},
    onOutlookLoginClick: () -> Unit = {},
    onCreateAccountClick: () -> Unit = {},
    navController: NavController
) {
    // State variables
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var isFormVisible by remember { mutableStateOf(false) }
    
    // Animation states
    val logoAlpha by animateFloatAsState(
        targetValue = if (isFormVisible) 1f else 0f,
        animationSpec = tween(durationMillis = 1000)
    )
    
    // Utilities
    val viewModel: LoginViewModel = viewModel()
    val context = LocalContext.current
    val loginResult by viewModel.loginResult.collectAsState()
    val tokenManager = remember { TokenManager(context) }
    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    
    // Screen size-aware padding
    val screenHeight = with(LocalDensity.current) {
        LocalContext.current.resources.displayMetrics.heightPixels / density
    }
    val topPadding = 24.dp
    val logoSize = 120.dp
    
    // Validation functions
    val validateEmail: () -> Boolean = {
        when {
            email.isEmpty() -> {
                emailError = "Email is required"
                false
            }
            !email.contains("@") || !email.contains(".") -> {
                emailError = "Please enter a valid email address"
                false
            }
            !email.endsWith(".edu") -> {
                emailError = "Please use an institutional email (.edu)"
                false
            }
            else -> {
                emailError = null
                true
            }
        }
    }
    
    val validatePassword: () -> Boolean = {
        when {
            password.isEmpty() -> {
                passwordError = "Password is required"
                false
            }
            password.length < 8 -> {
                passwordError = "Password must be at least 8 characters"
                false
            }
            else -> {
                passwordError = null
                true
            }
        }
    }
    
    // Handle login result
    LaunchedEffect(loginResult) {
        loginResult?.let { result ->
            isLoading = false
            result.onSuccess { response ->
                // Save the token to DataStore
                TokenManager.saveToken(context, response.token)
                
                // Navigate based on terms acceptance
                if (response.termsAccepted) {
                    navController.navigate("main") {
                        popUpTo("login") { inclusive = true }
                    }
                } else {
                    navController.navigate("terms") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            }.onFailure { error ->
                // Show error message
                when {
                    error.message?.contains("credentials", ignoreCase = true) == true -> {
                        passwordError = "Invalid email or password"
                    }
                    error.message?.contains("network", ignoreCase = true) == true -> {
                        passwordError = "Network error. Please check your connection."
                    }
                    else -> {
                        passwordError = error.message ?: "An unknown error occurred"
                    }
                }
            }
        }
    }
    
    // Animate form visibility after a delay
    LaunchedEffect(Unit) {
        delay(300)
        isFormVisible = true
    }
    
    // Main UI
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
                .verticalScroll(scrollState)
                .padding(horizontal = 16.dp)
                .wrapContentWidth(Alignment.CenterHorizontally),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(topPadding))
            
            // Logo with animation
            Box(
                modifier = Modifier
                    .size(logoSize)
                    .clip(RoundedCornerShape(20.dp))
                    .alpha(logoAlpha)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.logo),
                    contentDescription = "WildWatch Logo",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
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
                        text = "Welcome to WildWatch",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = WildWatchRed
                    )
                    
                    Text(
                        text = "Sign in to continue",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
                    )
                }
            }
            
            // Login form with animation
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
                    // Email field
                    OutlinedTextField(
                        value = email,
                        onValueChange = {
                            email = it
                            if (emailError != null) validateEmail()
                        },
                        label = { Text("Institutional Email") },
                        placeholder = { Text("your.name@institution.edu") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Outlined.MailOutline,
                                contentDescription = "Email",
                                tint = if (emailError != null) MaterialTheme.colorScheme.error 
                                       else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        },
                        trailingIcon = {
                            if (emailError != null) {
                                Icon(
                                    imageVector = Icons.Filled.Error,
                                    contentDescription = "Error",
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(FocusDirection.Down) }
                        ),
                        singleLine = true,
                        isError = emailError != null,
                        supportingText = {
                            emailError?.let {
                                Text(
                                    text = it,
                                    color = MaterialTheme.colorScheme.error
                                )
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WildWatchRed,
                            focusedLabelColor = WildWatchRed,
                            cursorColor = WildWatchRed
                        )
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Password field
                    PasswordTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            if (passwordError != null) validatePassword()
                        },
                        label = "Password",
                        placeholder = "Enter your password",
                        isError = passwordError != null,
                        errorMessage = passwordError,
                        leadingIcon = Icons.Outlined.Lock,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = {
                                keyboardController?.hide()
                                if (validateEmail() && validatePassword()) {
                                    isLoading = true
                                    viewModel.login(email, password)
                                }
                            }
                        ),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WildWatchRed,
                            focusedLabelColor = WildWatchRed,
                            cursorColor = WildWatchRed
                        )
                    )
                    
                    Box(modifier = Modifier.fillMaxWidth()) {
                        TextButton(
                            onClick = { onForgotPasswordClick() },
                            modifier = Modifier.align(Alignment.CenterEnd)
                        ) {
                            Text(
                                text = "Forgot Password?",
                                color = WildWatchRed,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Sign in button with loading state
                    Button(
                        onClick = {
                            keyboardController?.hide()
                            if (validateEmail() && validatePassword()) {
                                isLoading = true
                                viewModel.login(email, password)
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = WildWatchRed
                        ),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(24.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                "Sign In",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // OR divider
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Divider(
                            modifier = Modifier.weight(1f),
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                        )
                        Text(
                            text = "OR",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 8.dp)
                        )
                        Divider(
                            modifier = Modifier.weight(1f),
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Microsoft sign in button
                    OutlinedButton(
                        onClick = { 
                            coroutineScope.launch {
                                MicrosoftAuth.startMicrosoftLogin(context)
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        border = ButtonDefaults.outlinedButtonBorder.copy(
                            brush = SolidColor(WildWatchRed.copy(alpha = 0.5f))
                        )
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_microsoft),
                            contentDescription = "Microsoft",
                            tint = WildWatchRed,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Sign in with Microsoft",
                            color = WildWatchRed,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    
                    // Microsoft authentication note
                    if (screenHeight > 500) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                            )
                        ) {
                            Text(
                                text = "Note: When signing in with Microsoft, additional credentials may be required after authentication.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.weight(1f, fill = screenHeight > 600))
                    
                    // Create account link
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                        modifier = Modifier.padding(bottom = 12.dp, top = 4.dp)
                    ) {
                        Text(
                            text = "Don't have an account? ",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        
                        TextButton(onClick = { onCreateAccountClick() }) {
                            Text(
                                "Create Account",
                                color = WildWatchRed,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
