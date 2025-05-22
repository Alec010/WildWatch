package com.wildwatch.model

data class TagGenerationRequest(
    val description: String,
    val location: String
)

data class TagGenerationResponse(
    val tags: List<String>
) 