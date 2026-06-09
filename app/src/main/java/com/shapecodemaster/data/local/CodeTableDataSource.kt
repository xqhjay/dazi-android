package com.shapecodemaster.data.local

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.shapecodemaster.R
import com.shapecodemaster.data.model.CharacterInfo
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CodeTableDataSource @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val gson = Gson()

    suspend fun loadWubi86Table(): List<CharacterInfo> = withContext(Dispatchers.IO) {
        loadTableFromRaw(R.raw.wubi86_table)
    }

    suspend fun loadWubi98Table(): List<CharacterInfo> = withContext(Dispatchers.IO) {
        loadTableFromRaw(R.raw.wubi98_table)
    }

    private fun loadTableFromRaw(resourceId: Int): List<CharacterInfo> {
        return try {
            val jsonString = context.resources.openRawResource(resourceId)
                .bufferedReader()
                .use { it.readText() }

            val type = object : TypeToken<Map<String, List<CharacterInfoJson>>>() {}.type
            val data: Map<String, List<CharacterInfoJson>> = gson.fromJson(jsonString, type)

            data["characters"]?.map { json ->
                CharacterInfo(
                    char = json.char,
                    wubi86 = json.code,
                    wubi98 = json.code,
                    pinyin = json.pinyin,
                    radical = json.breakdown.firstOrNull() ?: "",
                    strokeCount = 0,
                    zone = json.zone,
                    breakdown = json.breakdown,
                    isLevel1Short = json.isLevel1Short,
                    isLevel2Short = json.isLevel2Short,
                    frequency = json.frequency
                )
            } ?: emptyList()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    private data class CharacterInfoJson(
        val char: String,
        val code: String,
        val pinyin: String,
        val breakdown: List<String>,
        val zone: String,
        val isLevel1Short: Boolean,
        val isLevel2Short: Boolean,
        val frequency: Int
    )
}