package com.wildwatch.ui.components

import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.wildwatch.model.WitnessDTO
import com.wildwatch.ui.theme.WildWatchRed

/**
 * Displays a progress step indicator with number, completion status, and title
 */
@Composable
fun ProgressStep(
    number: Int,
    title: String,
    isActive: Boolean,
    isCompleted: Boolean = false
) {
    val backgroundColor = when {
        isActive -> WildWatchRed
        isCompleted -> WildWatchRed
        else -> Color.Gray
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Circle with number
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(backgroundColor)
                .padding(4.dp),
            contentAlignment = Alignment.Center
        ) {
            if (isCompleted) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                )
            } else {
                Text(
                    text = number.toString(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Step title
        Text(
            text = title,
            fontSize = 12.sp,
            color = if (isActive || isCompleted) Color.Black else Color.Gray,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Displays a bullet point with text
 */
@Composable
fun BulletPoint(text: String) {
    Row(
        modifier = Modifier.padding(bottom = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "•",
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(end = 8.dp, top = 2.dp)
        )
        Text(text = text)
    }
}

/**
 * Alias for BulletPoint to maintain compatibility
 */
@Composable
fun BulletList(text: String) {
    BulletPoint(text)
}

/**
 * Displays a section title with optional trailing content
 */
@Composable
fun SectionTitle(
    title: String,
    modifier: Modifier = Modifier,
    trailingContent: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = title,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp
        )

        trailingContent?.invoke()
    }
}

/**
 * Displays a section header with icon
 */
@Composable
fun SectionHeader(
    title: String,
    icon: ImageVector,
    color: Color = WildWatchRed,
    modifier: Modifier = Modifier
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier.padding(bottom = 16.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier
                .size(32.dp)
                .background(color.copy(alpha = 0.1f), CircleShape)
                .padding(6.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = title,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

/**
 * Displays a help panel with tips
 */
@Composable
fun HelpPanel(
    modifier: Modifier = Modifier,
    darkRed: Color = WildWatchRed
) {
    Surface(
        modifier = modifier.padding(vertical = 8.dp),
        shape = RoundedCornerShape(8.dp),
        color = darkRed
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header with icon
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Evidence Guidelines",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            }

            // Subtitle
            Text(
                text = "Tips for submitting evidence:",
                color = Color.White,
                modifier = Modifier.padding(vertical = 8.dp)
            )

            // Bullet points
            BulletPoint("Upload clear, high-quality images", Color.White)
            BulletPoint("Include relevant timestamps in photos if possible", Color.White)
            BulletPoint("Ensure witness additional notes are detailed and accurate", Color.White)
            BulletPoint("Provide contact information for follow-up", Color.White)
        }
    }
}

@Composable
fun BulletPoint(text: String, textColor: Color = Color.Black) {
    Row(
        modifier = Modifier.padding(vertical = 4.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "• ",
            color = textColor,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(end = 4.dp)
        )
        Text(
            text = text,
            color = textColor
        )
    }
}

/**
 * Dialog for time picker
 */
@Composable
fun TimePickerDialog(
    onDismissRequest: () -> Unit,
    onConfirm: () -> Unit,
    content: @Composable () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismissRequest,
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("OK")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismissRequest) {
                Text("Cancel")
            }
        },
        text = { content() }
    )
}

/**
 * Displays a witness data card
 */
@Composable
fun WitnessCard(
    witness: WitnessDTO,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFF9F9F9)
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 1.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        modifier = Modifier.size(36.dp),
                        shape = CircleShape,
                        color = WildWatchRed.copy(alpha = 0.1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = WildWatchRed,
                            modifier = Modifier
                                .padding(8.dp)
                                .size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = witness.name,
                        fontWeight = FontWeight.Bold
                    )
                }

                IconButton(
                    onClick = onRemove,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Remove witness",
                        tint = Color.Gray
                    )
                }
            }

            if (witness.contactInformation.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Phone,
                        contentDescription = null,
                        tint = Color.Gray,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = witness.contactInformation,
                        fontSize = 14.sp,
                        color = Color.DarkGray
                    )
                }
            }

            if (witness.additionalNotes.isNotBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = witness.additionalNotes,
                    fontSize = 14.sp,
                    color = Color.DarkGray
                )
            }
        }
    }
}

/**
 * Displays a detail row with label and value
 */
@Composable
fun DetailRow(
    label: String,
    value: String,
    isMultiLine: Boolean = false
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Text(
            text = label,
            fontWeight = FontWeight.Medium,
            fontSize = 14.sp,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = value,
            fontSize = 14.sp,
            color = Color.Black,
            modifier = if (isMultiLine) Modifier.padding(top = 4.dp) else Modifier
        )

        if (!isMultiLine) {
            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider(
                color = Color(0xFFE5E7EB),
                thickness = 1.dp
            )
        }
    }
}

/**
 * Displays an image thumbnail
 */
@Composable
fun ImageThumbnail(
    filename: String,
    imageUri: Uri? = null
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(4.dp)
    ) {
        // Image thumbnail
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Color(0xFFE5E7EB))
                .border(1.dp, Color(0xFFD1D5DB), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            if (imageUri != null) {
                // Display the actual image if Uri is provided
                Image(
                    painter = rememberAsyncImagePainter(
                        model = imageUri
                    ),
                    contentDescription = "Uploaded image",
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
            } else {
                // Display placeholder with icon
                Icon(
                    imageVector = Icons.Default.Image,
                    contentDescription = null,
                    tint = Color.Gray,
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        // Filename label
        Text(
            text = filename,
            fontSize = 10.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 4.dp),
            maxLines = 1
        )
    }
}

/**
 * Confirmation checkbox with label
 */
@Composable
fun ConfirmationCheck(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    darkRed: Color = WildWatchRed
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
    ) {
        Checkbox(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = CheckboxDefaults.colors(checkedColor = darkRed)
        )
        Text(
            text = label,
            fontSize = 14.sp,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

/**
 * Navigation buttons for form screens
 */
@Composable
fun FormNavigationButtons(
    onBackClick: () -> Unit,
    onNextClick: () -> Unit,
    backText: String = "Back",
    nextText: String = "Continue",
    nextEnabled: Boolean = true,
    darkRed: Color = WildWatchRed,
    nextIcon: ImageVector = Icons.Default.ArrowForward
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        OutlinedButton(
            onClick = onBackClick,
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = darkRed
            ),
            border = BorderStroke(1.dp, darkRed),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = null,
                modifier = Modifier.padding(end = 8.dp)
            )
            Text(backText)
        }

        Spacer(modifier = Modifier.width(16.dp))

        Button(
            onClick = onNextClick,
            colors = ButtonDefaults.buttonColors(
                containerColor = darkRed
            ),
            shape = RoundedCornerShape(8.dp),
            enabled = nextEnabled,
            modifier = Modifier.weight(1f)
        ) {
            Text(nextText)
            Icon(
                imageVector = nextIcon,
                contentDescription = null,
                modifier = Modifier.padding(start = 8.dp)
            )
        }
    }
}
