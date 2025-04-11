package com.wildwatch.ui.components.bottomnav

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.unit.dp

@Composable
fun WarningTriangleIcon(
    modifier: Modifier = Modifier,
    color: Color = Color.Red
) {
    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height

        // Add padding to prevent cut-off
        val padding = width * 0.1f
        val triangleWidth = width - (padding * 2)
        val triangleHeight = height - (padding * 2)

        // Draw triangle with padding
        val trianglePath = Path().apply {
            moveTo(width / 2f, padding)
            lineTo(width - padding, height - padding)
            lineTo(padding, height - padding)
            close()
        }

        drawPath(
            path = trianglePath,
            color = color,
            style = Fill
        )

        // Draw exclamation mark
        val exclamationWidth = width / 10f
        val dotSize = width / 8f

        // Line part of exclamation mark
        drawRect(
            color = Color.White,
            topLeft = Offset(width / 2f - exclamationWidth / 2f, height * 0.25f),
            size = Size(exclamationWidth, height * 0.4f)
        )

        // Dot part of exclamation mark
        drawCircle(
            color = Color.White,
            radius = dotSize / 2f,
            center = Offset(width / 2f, height * 0.8f)
        )
    }
}

