package com.wildwatch.model

data class UserProfile(
    val id: Long,
    val firstName: String,
    val lastName: String,
    val middleInitial: String?,
    val email: String,
    val schoolIdNumber: String,
    val contactNumber: String,
    val role: String,
    val enabled: Boolean,
    val termsAccepted: Boolean
)
