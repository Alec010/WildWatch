package com.wildwatch.ui.screens.chatbot

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wildwatch.ui.theme.WildWatchRed
import com.wildwatch.viewmodel.ChatbotViewModel
import com.wildwatch.viewmodel.ChatbotViewModelFactory
import com.wildwatch.model.ChatMessage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatbotScreen(
    onBackClick: () -> Unit = {}
) {
    val context = LocalContext.current
    val viewModel: ChatbotViewModel = viewModel(factory = ChatbotViewModelFactory(context))
    var input by remember { mutableStateOf("") }
    val messages = viewModel.messages.collectAsState()
    val isLoading = viewModel.isLoading.collectAsState()
    val listState = rememberLazyListState()

    // Scroll to bottom when new message arrives
    LaunchedEffect(messages.value.size) {
        if (messages.value.isNotEmpty()) {
            listState.animateScrollToItem(messages.value.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.SmartToy,
                            contentDescription = null,
                            tint = WildWatchRed
                        )
                        Text(
                            text = "Ask Kat",
                            style = MaterialTheme.typography.titleLarge,
                            color = WildWatchRed
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Rounded.ArrowBack,
                            contentDescription = "Back",
                            tint = WildWatchRed
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF9F7F7))
        ) {
            // Messages List
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                itemsIndexed(messages.value) { index, message ->
                    ChatMessageItem(
                        message = message,
                        modifier = if (index == 0) Modifier.padding(top = 16.dp) else Modifier
                    )
                }
                if (isLoading.value) {
                    item {
                        LoadingIndicator()
                    }
                }
            }

            // Quick Responses (only show on first message)
            if (messages.value.size == 1) {
                QuickResponses(
                    onResponseClick = { response ->
                        input = response
                        viewModel.sendMessage(response)
                    }
                )
            }

            // Input Area
            InputArea(
                input = input,
                onInputChange = { input = it },
                onSendClick = {
                    if (input.trim().isNotEmpty()) {
                        viewModel.sendMessage(input)
                        input = ""
                    }
                },
                isLoading = isLoading.value
            )
        }
    }
}

@Composable
fun ChatMessageItem(message: ChatMessage, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = if (message.sender == "user") Arrangement.End else Arrangement.Start
    ) {
        if (message.sender == "bot") {
            // Bot Avatar
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(WildWatchRed.copy(alpha = 0.7f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.SmartToy,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        // Message Bubble
        Surface(
            modifier = Modifier.widthIn(max = 280.dp),
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (message.sender == "user") 16.dp else 4.dp,
                bottomEnd = if (message.sender == "user") 4.dp else 16.dp
            ),
            color = if (message.sender == "user") WildWatchRed else Color.White,
            shadowElevation = 2.dp
        ) {
            Text(
                text = message.text,
                modifier = Modifier.padding(12.dp),
                color = if (message.sender == "user") Color.White else Color.Black,
                fontSize = 14.sp
            )
        }

        if (message.sender == "user") {
            Spacer(modifier = Modifier.width(8.dp))
            // User Avatar
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(WildWatchRed),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.Person,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
fun LoadingIndicator() {
    Row(
        modifier = Modifier.padding(8.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        repeat(3) { index ->
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(WildWatchRed.copy(alpha = 0.4f))
            )
        }
    }
}

@Composable
fun QuickResponses(
    onResponseClick: (String) -> Unit
) {
    val quickResponses = listOf(
        "How do I report an incident?",
        "What offices are available?",
        "Tell me about WildWatch",
        "How to contact security?",
        "Where is the admin office?",
        "What are the reporting hours?",
        "How to track my report?",
        "Emergency procedures"
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text(
            text = "Suggested questions:",
            fontSize = 12.sp,
            color = Color.Gray,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            quickResponses.forEach { response ->
                OutlinedButton(
                    onClick = { onResponseClick(response) },
                    shape = RoundedCornerShape(20.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = WildWatchRed
                    ),
                    border = BorderStroke(1.dp, WildWatchRed.copy(alpha = 0.3f))
                ) {
                    Text(
                        text = response,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
fun InputArea(
    input: String,
    onInputChange: (String) -> Unit,
    onSendClick: () -> Unit,
    isLoading: Boolean
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = onInputChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Type your message here...") },
                shape = RoundedCornerShape(24.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = WildWatchRed,
                    unfocusedBorderColor = WildWatchRed.copy(alpha = 0.3f)
                ),
                enabled = !isLoading
            )
            Button(
                onClick = onSendClick,
                enabled = input.trim().isNotEmpty() && !isLoading,
                shape = CircleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = WildWatchRed
                )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Rounded.Send,
                        contentDescription = "Send"
                    )
                }
            }
        }
    }
}

