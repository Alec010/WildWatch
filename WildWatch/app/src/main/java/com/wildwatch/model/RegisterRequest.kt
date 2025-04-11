package com.wildwatch.model

data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val middleInitial: String?,
    val email: String,
    val schoolIdNumber: String,
    val password: String,
    val confirmPassword: String,
    val contactNumber: String
)
