package com.wildwatch.ui.screens.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.wildwatch.MainActivity
import com.wildwatch.utils.TokenManager
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope
import timber.log.Timber

class OAuthRedirectActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Timber.d("OAuthRedirectActivity created")
        handleIntent(intent)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
            }
        }
    }

    private fun handleIntent(intent: Intent?) {
        Timber.d("Handling intent: $intent")
        val uri = intent?.data
        Timber.d("OAuth redirect received: $uri")
        Toast.makeText(this, "Redirect URI: $uri", Toast.LENGTH_LONG).show()

        if (uri == null) {
            Timber.e("No URI in intent")
            showError("No redirect URI received")
            return
        }
        try {
            val params = uri.queryParameterNames
            for (param in params) {
                Timber.d("Query parameter: $param = ${uri.getQueryParameter(param)}")
            }

            val token = uri.getQueryParameter("token")
            val termsAccepted = uri.getQueryParameter("termsAccepted")?.toBoolean() ?: false
            Timber.d("Received token: ${token?.take(10)}..., termsAccepted: $termsAccepted")
            if (token.isNullOrBlank()) {
                Timber.e("No token in redirect URI")
                showError("No authentication token received")
                return
            }
            lifecycleScope.launch {
                TokenManager.saveToken(this@OAuthRedirectActivity, token)
                Timber.i("Token saved successfully")
                val mainIntent = Intent(this@OAuthRedirectActivity, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    putExtra("termsAccepted", termsAccepted)
                }
                startActivity(mainIntent)
                Timber.i("Navigating to MainActivity")
                finish()
            }
        } catch (e: Exception) {
            Timber.e(e, "Error processing redirect")
            showError("Error processing login: ${e.message}")
        }
    }

    private fun showError(message: String) {
        Timber.e(message)
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        finish()
    }
}