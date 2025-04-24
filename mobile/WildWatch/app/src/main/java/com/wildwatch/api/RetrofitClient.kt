package com.wildwatch.api

import android.content.Context
import com.wildwatch.utils.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.Request
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:8080/api/"

    val authApi: AuthApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(AuthApiService::class.java)
    }
    val incidentApi: IncidentApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(IncidentApi::class.java)
    }

    // ✅ SECURE incidentApi using JWT
    fun getIncidentApi(context: Context): IncidentApi {
        val tokenManager = TokenManager(context)

        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val token = runBlocking { tokenManager.getToken() } // ✅ Fix here
                val requestBuilder = chain.request().newBuilder()
                if (token != null) {
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }
                chain.proceed(requestBuilder.build())
            }
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(IncidentApi::class.java)
    }

    fun getCaseApi(context: Context): CaseApi {
        val tokenManager = TokenManager(context)

        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val token = runBlocking { tokenManager.getToken() }
                val requestBuilder = chain.request().newBuilder()
                if (token != null) {
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }
                chain.proceed(requestBuilder.build())
            }
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(CaseApi::class.java)
    }

}
