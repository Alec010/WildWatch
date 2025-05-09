package com.wildwatch.navigation

import android.util.Log
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.ui.screens.LoginScreen
import com.wildwatch.ui.screens.MainScreen
import com.wildwatch.ui.screens.SignUpScreen
import com.wildwatch.ui.screens.history.HistoryScreen
import com.wildwatch.ui.screens.casetracking.CaseDetailsScreen
import com.wildwatch.viewmodel.CaseDetailsViewModel
import com.wildwatch.viewmodel.CaseDetailsViewModelFactory
import com.wildwatch.utils.TokenManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object SignUp : Screen("signup")
    object Main : Screen("main")
    object ReportFlow : Screen("reportFlow")
    object History : Screen("history")
    object CaseDetails : Screen("caseDetails/{trackingNumber}") {
        fun createRoute(trackingNumber: String) = "caseDetails/$trackingNumber"
    }
    object ViewAllNotifications : Screen("viewAllNotifications")
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
fun AppNavGraph(navController: NavHostController) {
    val context = LocalContext.current
    var startDestination by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        val token = withContext(Dispatchers.IO) { TokenManager.getToken(context) }
        startDestination = if (!token.isNullOrBlank()) {
            Screen.Main.route
        } else {
            Screen.Login.route
        }
    }

    if (startDestination != null) {
        var mainScreenTab by remember { mutableStateOf("dashboard") }
        NavHost(
            navController = navController,
            startDestination = startDestination!!
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

            composable(Screen.History.route) {
                HistoryScreen()
            }

            composable(
                route = Screen.CaseDetails.route,
                arguments = listOf(
                    navArgument("trackingNumber") { type = androidx.navigation.NavType.StringType }
                )
            ) { backStackEntry ->
                val trackingNumber = backStackEntry.arguments?.getString("trackingNumber") ?: ""
                val viewModel: CaseDetailsViewModel = viewModel(
                    factory = CaseDetailsViewModelFactory(context)
                )
                CaseDetailsScreen(
                    viewModel = viewModel,
                    trackingNumber = trackingNumber,
                    onBackClick = { navController.popBackStack() }
                )
            }

            // Add the new route for viewing all notifications
            composable(Screen.ViewAllNotifications.route) {
                com.wildwatch.ui.screens.notification.ViewAllNotificationScreen(
                    navController = navController,
                    onBackClick = { navController.popBackStack() }
                )
            }
        }
    } else {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    }
}
