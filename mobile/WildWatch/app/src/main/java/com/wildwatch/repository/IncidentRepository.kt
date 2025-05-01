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
import android.webkit.MimeTypeMap

class IncidentRepository(private val api: IncidentApi) {

    suspend fun createIncident(
        request: IncidentRequest,
        files: List<File>? = null
    ): Response<IncidentResponse> {
        // Convert the IncidentRequest object to JSON
        val gson = Gson()
        val json = gson.toJson(request)
        println("📤 Sending JSON: $json")

        // Prepare the JSON data as a RequestBody
        val incidentData = json.toRequestBody("application/json".toMediaTypeOrNull())

        // Prepare the file parts if there are files to be uploaded
        val fileParts = files?.mapNotNull { file ->
            try {
                // Get file extension and MIME type
                val extension = file.extension
                val mimeType = MimeTypeMap.getSingleton()
                    .getMimeTypeFromExtension(extension)
                    ?: "application/octet-stream"

                // Create RequestBody from file
                val requestFile = file.readBytes()
                    .toRequestBody(mimeType.toMediaTypeOrNull(), 0, file.length().toInt())


                // Create MultipartBody.Part
                MultipartBody.Part.createFormData(
                    "files",
                    file.name,
                    requestFile
                )
            } catch (e: Exception) {
                println("❌ Error processing file ${file.name}: ${e.message}")
                null
            }
        }

        // Make the network request by sending both JSON data and file parts
        val response = api.createIncident(incidentData, fileParts)

        if (!response.isSuccessful) {
            println("❌ ${response.code()}: ${response.errorBody()?.string()}")
        }

        // Return the response
        return response
    }
}
