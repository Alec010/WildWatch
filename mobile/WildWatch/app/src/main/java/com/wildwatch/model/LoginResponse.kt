package com.wildwatch.model

data class LoginResponse(
    val token: String,
    val termsAccepted: Boolean,
    val message: String
)
