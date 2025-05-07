package com.wildwatch.network

import com.google.gson.TypeAdapter
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonWriter
import java.text.SimpleDateFormat
import java.util.*

class CustomDateTypeAdapter : TypeAdapter<Date>() {
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSS", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC") // Assume UTC if no timezone
    }

    override fun write(out: JsonWriter, value: Date?) {
        if (value == null) {
            out.nullValue()
        } else {
            out.value(dateFormat.format(value))
        }
    }

    override fun read(input: JsonReader): Date? {
        val dateStr = input.nextString()
        return try {
            dateFormat.parse(dateStr)
        } catch (e: Exception) {
            throw RuntimeException("Failed to parse date: $dateStr", e)
        }
    }
}