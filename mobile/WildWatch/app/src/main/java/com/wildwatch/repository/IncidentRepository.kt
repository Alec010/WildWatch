package com.wildwatch.repository

import com.google.gson.Gson
import com.wildwatch.api.IncidentApi
import com.wildwatch.model.IncidentRequest
import com.wildwatch.model.IncidentResponse
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MultipartBody
import retrofit2.Response
import java.io.File

class IncidentRepository(private val api: IncidentApi) {

    suspend fun createIncident(
        request: IncidentRequest,
        files: List<File>? = null
    ): Response<IncidentResponse> {
        val gson = Gson()
        val json = gson.toJson(request)
        println("📤 Sending JSON: $json")
        val incidentData = json.toRequestBody("text/plain".toMediaTypeOrNull())

        val fileParts = files?.map { file ->
            val requestFile = file.readBytes().toRequestBody("multipart/form-data".toMediaTypeOrNull())
            MultipartBody.Part.createFormData("files", file.name, requestFile)
        }

        // ✅ Call ONCE and store the response
        val response = api.createIncident(incidentData, fileParts)
        if (!response.isSuccessful) {
            println("❌ ${response.code()}: ${response.errorBody()?.string()}")
        }
        return response  // ✅ Return the same response, not call again!
    }
}
