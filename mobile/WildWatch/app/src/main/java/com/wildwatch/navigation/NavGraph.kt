package com.wildwatch.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.wildwatch.ui.screens.LoginScreen
import com.wildwatch.ui.screens.SignUpScreen
import com.wildwatch.ui.screens.MainScreen
import com.wildwatch.ui.screens.profile.ProfileScreen
import com.wildwatch.ui.screens.dashboard.DashboardScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object SignUp : Screen("signup")
    object Main : Screen("main")
    object Profile : Screen("profile")
    object Dashboard : Screen("dashboard")

}

@Composable
fun NavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginClick = { email, password ->
                    // handled in LoginScreen via ViewModel
                },
                onForgotPasswordClick = { /* handle forgot password */ },
                onOutlookLoginClick = { /* handle Outlook login */ },
                onCreateAccountClick = {
                    navController.navigate(Screen.SignUp.route)
                },
                navController = navController
            )
        }

        composable(Screen.SignUp.route) {
            SignUpScreen(
                onSignInClick = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },

            )
        }

        // 👇 NEW route
        composable(Screen.Main.route) {
            MainScreen()
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                onBackClick = {

                },
                onEditProfileClick = {
                    // Handle edit profile action
                },
                onUpdateAccountClick = {
                    // Handle update account action
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onProfileClick = {
                    navController.navigate(Screen.Profile.route)
                }
            )
        }
    }
}
