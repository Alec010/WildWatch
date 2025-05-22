package com.wildwatch.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.wildwatch.api.RetrofitClient
import timber.log.Timber

object MicrosoftAuth {
    private const val REDIRECT_URI = "wildwatch://oauth2redirect"

    fun startMicrosoftLogin(context: Context) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                Timber.d("Starting Microsoft login with redirect URI: $REDIRECT_URI")
                val response = RetrofitClient.authApi.getMicrosoftOAuthUrl(REDIRECT_URI)
                val oauthUrl = response.url
                Timber.d("Received OAuth URL: $oauthUrl")
                
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(oauthUrl)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                Timber.i("Microsoft login intent started")
            } catch (e: Exception) {
                Timber.e(e, "Failed to start Microsoft login")
                Toast.makeText(context, "Failed to start Microsoft login: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}