package com.shapecodemaster.ui.screens.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.FormatListNumbered
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToPractice: (String, String) -> Unit,
    onNavigateToMistakeBook: () -> Unit,
    onNavigateToRadicalTable: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val mistakeCount by viewModel.mistakeCount.collectAsState(initial = 0)
    val todayDuration by viewModel.todayDuration.collectAsState(initial = 0L)

    val practiceItems = listOf(
        PracticeItem("single", "单字练习", Icons.Default.MenuBook, "横竖撇捺折，逐区突破"),
        PracticeItem("phrase", "词组练习", Icons.Default.FormatListNumbered, "常用词组，连贯输入"),
        PracticeItem("sentence", "句子练习", Icons.Default.Book, "长句文章，实战模拟"),
        PracticeItem("mistake", "错字本", Icons.Default.Warning, "针对性复习，强化记忆")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("形码大师")
                        Text(
                            text = "今日练习: ${formatDuration(todayDuration)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                text = "选择练习类型",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(practiceItems) { item ->
                    PracticeCard(
                        item = item,
                        badgeCount = if (item.id == "mistake") mistakeCount else 0,
                        onClick = {
                            when (item.id) {
                                "mistake" -> onNavigateToMistakeBook()
                                else -> onNavigateToPractice(item.id, "all")
                            }
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Card(
                onClick = onNavigateToRadicalTable,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.School,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Column(modifier = Modifier.padding(start = 16.dp)) {
                        Text(
                            text = "字根表",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = "查看五笔字根分布",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PracticeCard(
    item: PracticeItem,
    badgeCount: Int,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (badgeCount > 0) {
                BadgedBox(
                    badge = {
                        Badge { Text(badgeCount.toString()) }
                    }
                ) {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            } else {
                Icon(
                    imageVector = item.icon,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = item.title,
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center
            )

            Text(
                text = item.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

data class PracticeItem(
    val id: String,
    val title: String,
    val icon: ImageVector,
    val description: String
)

private fun formatDuration(durationMs: Long): String {
    val minutes = durationMs / 60000
    val seconds = (durationMs % 60000) / 1000
    return if (minutes > 0) {
        "${minutes}分${seconds}秒"
    } else {
        "${seconds}秒"
    }
}