package com.wildwatch.repository

import android.util.Log
import com.wildwatch.api.RetrofitClient
import com.wildwatch.model.LoginRequest
import com.wildwatch.model.LoginResponse
import com.wildwatch.model.RegisterRequest
import retrofit2.HttpException
import java.io.IOException

class AuthRepository {
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        Log.d("LOGIN_DEBUG", "Attempting login with: $email / $password")

        return try {
            val response = RetrofitClient.authApi.login(LoginRequest(email, password))

            Log.d("LOGIN_DEBUG", "Status Code: ${response.code()}")
            Log.d("LOGIN_DEBUG", "Success: ${response.isSuccessful}")
            Log.d("LOGIN_DEBUG", "Raw body: ${response.body()}")
            Log.d("LOGIN_DEBUG", "Error body: ${response.errorBody()?.string()}")

            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("HTTP ${response.code()}: ${response.errorBody()?.string()}"))
            }
        } catch (e: Exception) {
            Log.e("LOGIN_DEBUG", "Exception: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun registerUser(request: RegisterRequest): Result<Unit> {
        return try {
            val response = RetrofitClient.authApi.register(request)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Registration failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

}

