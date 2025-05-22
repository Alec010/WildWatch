package com.wildwatch.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.IncidentFormViewModel

@Composable
fun TagChip(
    tag: String,
    isSelected: Boolean,
    onTagClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = if (isSelected) WildWatchRed else Color.LightGray,
        modifier = modifier
            .padding(2.dp)
            .clickable { onTagClick() }
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Text(
                text = tag,
                color = if (isSelected) Color.White else Color.Black,
                fontSize = 14.sp
            )
            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Remove tag",
                    tint = Color.White,
                    modifier = Modifier
                        .size(16.dp)
                        .padding(start = 4.dp)
                )
            }
        }
    }
}

@Composable
fun TagGenerationSection(
    description: String,
    location: String,
    viewModel: IncidentFormViewModel,
    modifier: Modifier = Modifier
) {
    val generatedTags by viewModel.generatedTags.collectAsState()
    val isGeneratingTags by viewModel.isGeneratingTags.collectAsState()
    val selectedTags by viewModel.selectedTags.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    Column(modifier = modifier) {
        Button(
            onClick = { viewModel.generateTags(description, location) },
            enabled = !isGeneratingTags && description.isNotBlank() && location.isNotBlank(),
            colors = ButtonDefaults.buttonColors(
                containerColor = WildWatchRed
            ),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (isGeneratingTags) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = Color.White
                )
            } else {
                Text("Generate Tags")
            }
        }

        errorMessage?.let { message ->
            Text(
                text = message,
                color = Color.Red,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        if (generatedTags.isNotEmpty()) {
            Text(
                text = "Select up to 5 tags:",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 8.dp)
            )
            
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(generatedTags) { tag ->
                    TagChip(
                        tag = tag,
                        isSelected = selectedTags.contains(tag),
                        onTagClick = { viewModel.toggleTag(tag) }
                    )
                }
            }
        }
    }
} 