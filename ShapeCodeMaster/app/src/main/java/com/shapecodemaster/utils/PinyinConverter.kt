package com.shapecodemaster.utils

object PinyinConverter {
    // Simple pinyin conversion utilities
    // In a real implementation, this would use a proper pinyin library

    fun isPinyin(input: String): Boolean {
        return input.all { it.isLetter() }
    }

    fun normalizePinyin(pinyin: String): String {
        return pinyin.lowercase().trim()
    }
}