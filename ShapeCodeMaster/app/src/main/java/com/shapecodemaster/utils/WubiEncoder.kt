package com.shapecodemaster.utils

object WubiEncoder {
    // Wubi 86 encoding rules and helpers
    // This is a placeholder for actual encoding logic
    // In a real implementation, this would contain the full encoding algorithm

    fun getZoneForKey(key: String): String {
        return when (key.uppercase()) {
            in listOf("G", "F", "D", "S", "A") -> "横区"
            in listOf("H", "J", "K", "L", "M") -> "竖区"
            in listOf("T", "R", "E", "W", "Q") -> "撇区"
            in listOf("Y", "U", "I", "O", "P") -> "捺区"
            in listOf("N", "B", "V", "C", "X") -> "折区"
            else -> "未知"
        }
    }

    fun isValidWubiCode(code: String): Boolean {
        return code.length in 1..4 && code.all { it.isLetter() }
    }
}