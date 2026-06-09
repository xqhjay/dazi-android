package com.shapecodemaster.ui.screens.radicals

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RadicalTableScreen(
    onNavigateBack: () -> Unit,
    onNavigateToQuery: () -> Unit
) {
    var selectedZone by remember { mutableStateOf("全部") }

    val zones = listOf("全部", "横区", "竖区", "撇区", "捺区", "折区")

    val keyboardData = remember {
        listOf(
            KeyboardRow(
                listOf(
                    KeyData("Q", "撇区", listOf("金", "勹", "夕", "鱼", "犬"), listOf("钱", "够", "多", "鲜", "狗")),
                    KeyData("W", "撇区", listOf("人", "八", "亻", "癸"), listOf("会", "分", "他", "登")),
                    KeyData("E", "撇区", listOf("月", "彡", "乃", "用"), listOf("明", "形", "奶", "朋")),
                    KeyData("R", "撇区", listOf("白", "手", "斤", "丘"), listOf("的", "看", "断", "兵")),
                    KeyData("T", "撇区", listOf("禾", "竹", "彳", "夂"), listOf("和", "笔", "行", "处")),
                    KeyData("Y", "捺区", listOf("言", "讠", "文", "方"), listOf("说", "话", "字", "放")),
                    KeyData("U", "捺区", listOf("立", "辛", "六", "门"), listOf("站", "辣", "交", "问")),
                    KeyData("I", "捺区", listOf("水", "氵", "小", "井"), listOf("海", "江", "少", "进")),
                    KeyData("O", "捺区", listOf("火", "灬", "米", "业"), listOf("烧", "煮", "粮", "亚")),
                    KeyData("P", "捺区", listOf("之", "宀", "冖", "廴"), listOf("的", "家", "写", "建"))
                )
            ),
            KeyboardRow(
                listOf(
                    KeyData("A", "横区", listOf("工", "戈", "艹", "廿"), listOf("作", "战", "花", "甘")),
                    KeyData("S", "横区", listOf("木", "丁", "西", "甫"), listOf("林", "打", "要", "辅")),
                    KeyData("D", "横区", listOf("大", "石", "厂", "犬"), listOf("天", "破", "历", "狗")),
                    KeyData("F", "横区", listOf("土", "士", "二", "干"), listOf("地", "志", "于", "平")),
                    KeyData("G", "横区", listOf("王", "五", "一", "戋"), listOf("国", "伍", "大", "钱")),
                    KeyData("H", "竖区", listOf("目", "上", "止", "卜"), listOf("看", "下", "步", "占")),
                    KeyData("J", "竖区", listOf("日", "曰", "早", "虫"), listOf("明", "昌", "晨", "蝴")),
                    KeyData("K", "竖区", listOf("口", "川", "申", "囗"), listOf("吃", "顺", "神", "国")),
                    KeyData("L", "竖区", listOf("田", "甲", "申", "车"), listOf("野", "男", "伸", "辆"))
                )
            ),
            KeyboardRow(
                listOf(
                    KeyData("Z", "折区", listOf("纟", "幺", "弓", "匕"), listOf("红", "幻", "张", "比")),
                    KeyData("X", "折区", listOf("又", "幺", "母", "彐"), listOf("双", "幼", "妈", "寻")),
                    KeyData("C", "折区", listOf("马", "厶", "巴", "么"), listOf("骑", "私", "爸", "什")),
                    KeyData("V", "折区", listOf("女", "刀", "九", "臼"), listOf("她", "切", "久", "舅")),
                    KeyData("B", "折区", listOf("子", "耳", "卩", "了"), listOf("孩", "听", "即", "了")),
                    KeyData("N", "折区", listOf("已", "己", "巳", "心"), listOf("经", "自", "包", "想")),
                    KeyData("M", "折区", listOf("山", "由", "贝", "冂"), listOf("峰", "油", "财", "同"))
                )
            )
        )
    }

    val filteredData = if (selectedZone == "全部") {
        keyboardData
    } else {
        keyboardData.map { row ->
            KeyboardRow(row.keys.filter { it.zone == selectedZone })
        }.filter { it.keys.isNotEmpty() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("字根表") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToQuery) {
                        Icon(Icons.Default.Search, contentDescription = "查询")
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
            // Zone Filter
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                zones.forEach { zone ->
                    FilterChip(
                        selected = selectedZone == zone,
                        onClick = { selectedZone = zone },
                        label = { Text(zone) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Keyboard Layout
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredData) { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        row.keys.forEach { key ->
                            KeyCard(
                                keyData = key,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun KeyCard(
    keyData: KeyData,
    modifier: Modifier = Modifier
) {
    var showDetail by remember { mutableStateOf(false) }

    Card(
        modifier = modifier
            .height(80.dp)
            .clickable { showDetail = !showDetail },
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = keyData.key,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = keyData.radicals.take(3).joinToString(""),
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center
            )
        }
    }

    if (showDetail) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showDetail = false },
            title = { Text("键位 ${keyData.key} - ${keyData.zone}") },
            text = {
                Column {
                    Text(
                        text = "字根: ${keyData.radicals.joinToString("、")}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "例字: ${keyData.examples.joinToString("、")}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showDetail = false }) {
                    Text("关闭")
                }
            }
        )
    }
}

data class KeyboardRow(val keys: List<KeyData>)
data class KeyData(
    val key: String,
    val zone: String,
    val radicals: List<String>,
    val examples: List<String>
)

@Composable
fun TextButton(onClick: () -> Unit, content: @Composable () -> Unit) {
    androidx.compose.material3.TextButton(onClick = onClick) {
        content()
    }
}
