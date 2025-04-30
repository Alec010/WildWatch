package com.wildwatch.model

data class OfficeResponse(
    val code: String,       // The office code (e.g., OP, VPAA, etc.)
    val fullName: String,   // The full name of the office
    val description: String // A short description of the office
)
