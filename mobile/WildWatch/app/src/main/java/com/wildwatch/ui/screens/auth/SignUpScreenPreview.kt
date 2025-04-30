package com.wildwatch.ui.screens.auth

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import com.wildwatch.ui.theme.WildWatchTheme
import com.wildwatch.ui.screens.SignUpScreen

@Preview(showBackground = true)
@Composable
fun SignUpScreenPreview() {
    WildWatchTheme {
        val navController = rememberNavController() // Create a dummy navController for preview
        SignUpScreen(
            onSignInClick = {},

        )
    }
}
