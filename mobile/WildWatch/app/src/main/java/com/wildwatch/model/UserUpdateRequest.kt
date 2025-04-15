package com.wildwatch.model

data class UserUpdateRequest(
    val firstName: String,
    val lastName: String,
    val middleInitial: String?,
    val contactNumber: String
)
