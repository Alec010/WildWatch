package com.wildwatch.ui.screens.auth

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import com.wildwatch.ui.theme.WildWatchTheme
import com.wildwatch.ui.screens.LoginScreen

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    WildWatchTheme {
        val navController = rememberNavController() // Create a dummy navController for preview
        LoginScreen(
            onLoginClick = { _, _ -> },
            onForgotPasswordClick = {},
            onOutlookLoginClick = {},
            onCreateAccountClick = {},
            navController = navController // Pass the dummy navController to LoginScreen
        )
    }
}
