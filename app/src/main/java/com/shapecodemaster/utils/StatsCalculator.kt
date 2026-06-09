package com.shapecodemaster.utils

object StatsCalculator {

    fun calculateWPM(charCount: Int, durationMs: Long): Float {
        val minutes = durationMs / 60000.0
        return if (minutes > 0) (charCount / minutes).toFloat() else 0f
    }

    fun calculateAccuracy(correct: Int, total: Int): Float {
        return if (total > 0) (correct.toFloat() / total * 100) else 0f
    }

    fun calculateCPM(keyCount: Int, durationMs: Long): Float {
        val minutes = durationMs / 60000.0
        return if (minutes > 0) (keyCount / minutes).toFloat() else 0f
    }

    fun formatTime(ms: Long): String {
        val seconds = ms / 1000
        val minutes = seconds / 60
        val remainingSeconds = seconds % 60
        return String.format("%02d:%02d", minutes, remainingSeconds)
    }

    fun formatDuration(ms: Long): String {
        val minutes = ms / 60000
        val seconds = (ms % 60000) / 1000
        return if (minutes > 0) {
            "${minutes}分${seconds}秒"
        } else {
            "${seconds}秒"
        }
    }
}