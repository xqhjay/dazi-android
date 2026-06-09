package com.shapecodemaster.utils

object Wubi98Encoder {
    // Wubi 98 encoding rules and helpers
    // This is a placeholder for actual encoding logic

    fun getZoneForKey(key: String): String {
        return WubiEncoder.getZoneForKey(key)
    }

    fun isValidWubiCode(code: String): Boolean {
        return WubiEncoder.isValidWubiCode(code)
    }
}