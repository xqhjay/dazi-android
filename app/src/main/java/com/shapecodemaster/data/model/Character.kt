package com.shapecodemaster.data.model

data class CharacterInfo(
    val char: String,
    val wubi86: String,
    val wubi98: String,
    val pinyin: String,
    val radical: String,
    val strokeCount: Int,
    val zone: String,
    val breakdown: List<String>,
    val isLevel1Short: Boolean,
    val isLevel2Short: Boolean,
    val frequency: Int
)

data class RadicalInfo(
    val key: String,
    val zone: String,
    val radicals: List<String>,
    val examples: List<String>
)

data class PracticeSession(
    val type: PracticeType,
    val targetText: String,
    val zoneFilter: String? = null
)

enum class PracticeType {
    SINGLE_CHAR,
    PHRASE,
    SENTENCE,
    MISTAKE
}

data class PracticeResult(
    val type: PracticeType,
    val duration: Long,
    val totalChars: Int,
    val correctChars: Int,
    val wrongChars: Int,
    val backspaceCount: Int,
    val wpm: Float,
    val accuracy: Float,
    val mistakeChars: List<String>,
    val timestamp: Long = System.currentTimeMillis()
)

enum class CodeTableType {
    WUBI_86,
    WUBI_98
}

enum class ThemeMode {
    LIGHT,
    DARK,
    SYSTEM
}