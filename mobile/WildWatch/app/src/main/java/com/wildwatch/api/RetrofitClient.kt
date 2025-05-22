package com.wildwatch.api

import android.content.Context
import android.util.Log
import com.google.gson.GsonBuilder
import com.wildwatch.BuildConfig
import com.wildwatch.network.ActivityLogService
import com.wildwatch.network.CustomDateTypeAdapter
import com.wildwatch.utils.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.*
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val API_PATH = "/api/"
    private val BASE_URL = BuildConfig.API_BASE_URL + API_PATH

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

    fun getIncidentApi(context: Context): IncidentApi {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val token = runBlocking { TokenManager.getToken(context) }
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
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val token = runBlocking { TokenManager.getToken(context) }
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

    val officeApi: OfficeService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(OfficeService::class.java)
    }

    fun getActivityLogApi(context: Context): ActivityLogService {
        val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .addInterceptor { chain ->
                val token = runBlocking { TokenManager.getToken(context) }
                Log.d("RetrofitClient", "ActivityLogApi Token: $token")
                val requestBuilder = chain.request().newBuilder()
                if (token != null) {
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }
                chain.proceed(requestBuilder.build())
            }
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        val gson = GsonBuilder()
            .registerTypeAdapter(Date::class.java, CustomDateTypeAdapter())
            .create()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(ActivityLogService::class.java)
    }
}