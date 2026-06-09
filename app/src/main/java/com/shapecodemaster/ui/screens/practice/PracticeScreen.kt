package com.shapecodemaster.ui.screens.practice

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.shapecodemaster.data.model.PracticeResult
import com.shapecodemaster.ui.theme.CorrectGreen
import com.shapecodemaster.ui.theme.CurrentBlue
import com.shapecodemaster.ui.theme.ErrorRed
import com.shapecodemaster.ui.theme.KeyboardKeyColor
import com.shapecodemaster.ui.theme.KeyboardKeyDarkColor
import com.shapecodemaster.ui.theme.PendingGray

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PracticeScreen(
    practiceType: String,
    zoneFilter: String,
    onNavigateBack: () -> Unit,
    onPracticeComplete: (PracticeResult) -> Unit,
    viewModel: PracticeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(getPracticeTitle(practiceType))
                        Text(
                            text = "${uiState.currentIndex}/${uiState.totalChars}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        if (uiState.isPaused) viewModel.resumePractice() else viewModel.pausePractice()
                    }) {
                        Icon(
                            if (uiState.isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                            contentDescription = if (uiState.isPaused) "继续" else "暂停"
                        )
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
            ) {
                // Stats Bar
                StatsBar(
                    wpm = uiState.wpm,
                    accuracy = uiState.accuracy,
                    elapsedTime = uiState.elapsedTime
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Target Text Display
                TargetTextDisplay(
                    targetText = uiState.targetText,
                    currentIndex = uiState.currentIndex,
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Hint
                AnimatedVisibility(
                    visible = uiState.showHint,
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            text = uiState.hintText,
                            modifier = Modifier.padding(12.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Virtual Keyboard
                VirtualKeyboard(
                    onKeyPress = { viewModel.onKeyPress(it) },
                    onBackspace = { viewModel.onBackspace() },
                    isDarkTheme = false
                )
            }
        }
    }

    if (uiState.isPaused) {
        AlertDialog(
            onDismissRequest = { viewModel.resumePractice() },
            title = { Text("练习暂停") },
            text = { Text("点击继续按钮恢复练习") },
            confirmButton = {
                TextButton(onClick = { viewModel.resumePractice() }) {
                    Text("继续")
                }
            },
            dismissButton = {
                TextButton(onClick = onNavigateBack) {
                    Text("退出")
                }
            }
        )
    }

    if (uiState.isFinished) {
        val result = PracticeResult(
            type = com.shapecodemaster.data.model.PracticeType.SINGLE_CHAR,
            duration = uiState.elapsedTime,
            totalChars = uiState.totalChars,
            correctChars = uiState.correctChars,
            wrongChars = uiState.mistakeCount,
            backspaceCount = uiState.backspaceCount,
            wpm = uiState.wpm,
            accuracy = uiState.accuracy,
            mistakeChars = emptyList()
        )
        onPracticeComplete(result)
    }
}

@Composable
fun StatsBar(
    wpm: Float,
    accuracy: Float,
    elapsedTime: Long
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        StatItem("速度", "${wpm.toInt()} 字/分")
        StatItem("准确率", "${accuracy.toInt()}%")
        StatItem("用时", formatTime(elapsedTime))
    }
}

@Composable
fun StatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun TargetTextDisplay(
    targetText: String,
    currentIndex: Int,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(16.dp)
    ) {
        Text(
            text = buildString {
                targetText.forEachIndexed { index, char ->
                    when {
                        index < currentIndex -> append(char)
                        index == currentIndex -> append(char)
                        else -> append(char)
                    }
                }
            },
            style = MaterialTheme.typography.displaySmall.copy(
                fontFamily = FontFamily.Monospace
            ),
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
        )

        // Overlay for coloring
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            targetText.forEachIndexed { index, char ->
                val color = when {
                    index < currentIndex -> CorrectGreen
                    index == currentIndex -> CurrentBlue
                    else -> PendingGray
                }
                val backgroundColor = when {
                    index == currentIndex -> CurrentBlue.copy(alpha = 0.2f)
                    else -> Color.Transparent
                }

                Box(
                    modifier = Modifier
                        .background(backgroundColor)
                        .border(
                            width = if (index == currentIndex) 2.dp else 0.dp,
                            color = if (index == currentIndex) CurrentBlue else Color.Transparent
                        )
                ) {
                    Text(
                        text = char.toString(),
                        color = color,
                        style = MaterialTheme.typography.displaySmall.copy(
                            fontFamily = FontFamily.Monospace
                        ),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

@Composable
fun VirtualKeyboard(
    onKeyPress: (String) -> Unit,
    onBackspace: () -> Unit,
    isDarkTheme: Boolean
) {
    val keys = listOf(
        listOf("Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"),
        listOf("A", "S", "D", "F", "G", "H", "J", "K", "L"),
        listOf("Z", "X", "C", "V", "B", "N", "M")
    )

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        keys.forEachIndexed { rowIndex, row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterHorizontally)
            ) {
                row.forEach { key ->
                    KeyboardKey(
                        key = key,
                        onClick = { onKeyPress(key) },
                        isDarkTheme = isDarkTheme,
                        modifier = Modifier.weight(1f)
                    )
                }
                if (rowIndex == 2) {
                    KeyboardKey(
                        key = "←",
                        onClick = onBackspace,
                        isDarkTheme = isDarkTheme,
                        modifier = Modifier.width(60.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun KeyboardKey(
    key: String,
    onClick: () -> Unit,
    isDarkTheme: Boolean,
    modifier: Modifier = Modifier
) {
    val backgroundColor = if (isDarkTheme) KeyboardKeyDarkColor else KeyboardKeyColor

    Box(
        modifier = modifier
            .height(48.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor)
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = key,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

private fun getPracticeTitle(type: String): String {
    return when (type) {
        "single" -> "单字练习"
        "phrase" -> "词组练习"
        "sentence" -> "句子练习"
        "mistake" -> "错字练习"
        else -> "练习"
    }
}

private fun formatTime(ms: Long): String {
    val seconds = ms / 1000
    val minutes = seconds / 60
    val remainingSeconds = seconds % 60
    return String.format("%02d:%02d", minutes, remainingSeconds)
}
