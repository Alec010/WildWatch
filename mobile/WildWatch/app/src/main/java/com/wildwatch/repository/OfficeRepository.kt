package com.wildwatch.repository

import com.wildwatch.api.RetrofitClient
import com.wildwatch.model.OfficeResponse
import retrofit2.Response

class OfficeRepository {

    suspend fun getOffices(token: String): Response<List<OfficeResponse>> {
        // Make the API call
        return RetrofitClient.officeApi.getOffices("Bearer $token")
    }
}
