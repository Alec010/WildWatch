sealed class Screen(val route: String) {
    object Login : Screen("login")
    object SignUp : Screen("signup")
    object Main : Screen("main")
    object ReportFlow : Screen("reportFlow")
    object History : Screen("history")
    object CaseDetails : Screen("caseDetails/{trackingNumber}") {
        fun createRoute(trackingNumber: String) = "caseDetails/$trackingNumber"
    }
} 