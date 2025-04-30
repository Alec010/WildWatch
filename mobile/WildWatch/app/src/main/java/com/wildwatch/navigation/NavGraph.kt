package com.wildwatch.navigation

import android.util.Log
import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.wildwatch.ui.screens.LoginScreen
import com.wildwatch.ui.screens.MainScreen
import com.wildwatch.ui.screens.SignUpScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object SignUp : Screen("signup")
    object Main : Screen("main")
    object ReportFlow : Screen("reportFlow")
}

private fun navigateBackToMain(
    navController: NavHostController,
    setTab: (String) -> Unit
) {
    setTab("dashboard")
    // ✅ Safely pop the entire ReportFlow from the backstack!
    Log.d("DEBUG", "🏁 navigateBackToMain called — popping back stack")
    navController.popBackStack(Screen.ReportFlow.route, inclusive = true)
    navController.navigate(Screen.Main.route) {
        launchSingleTop = true
    }
    Log.d("NavGraph", "✅ Navigated back to MainScreen after report submit")
}

@Composable
fun NavGraph(navController: NavHostController) {
    var mainScreenTab by remember { mutableStateOf("dashboard") }

    NavHost(
        navController = navController,
        startDestination = Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginClick = { _, _ -> },
                onForgotPasswordClick = {},
                onOutlookLoginClick = {},
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
                }
            )
        }

        composable(Screen.Main.route) {
            MainScreen(
                navController = navController,
                currentTab = mainScreenTab,
                onTabChange = { mainScreenTab = it }
            )
        }

        composable(Screen.ReportFlow.route) {
            ReportFlowHost(
                onExit = {
                    navigateBackToMain(navController) { mainScreenTab = it }
                    Log.d("ReportFlow", "✅ onExit called!")
                }
            )
        }
    }
}
