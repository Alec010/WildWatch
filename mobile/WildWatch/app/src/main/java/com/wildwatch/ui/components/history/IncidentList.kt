package com.wildwatch.ui.components.history

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.wildwatch.model.IncidentResponse

@Composable
fun IncidentList(
    incidents: List<IncidentResponse>,
    onIncidentClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        modifier = modifier.fillMaxWidth()
    ) {
        items(incidents) { incident ->
            IncidentCard(incident = incident, onViewDetailsClick = onIncidentClick)
        }
    }
} 