package com.shapecodemaster.data.repository

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.shapecodemaster.data.local.database.dao.CharacterDao
import com.shapecodemaster.data.local.database.entity.CharacterEntity
import com.shapecodemaster.data.model.CharacterInfo
import com.shapecodemaster.data.model.RadicalInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CharacterRepository @Inject constructor(
    private val characterDao: CharacterDao
) {
    private val gson = Gson()

    suspend fun getCharacterInfo(char: String): CharacterInfo? = withContext(Dispatchers.IO) {
        characterDao.getCharacter(character = char)?.toModel()
    }

    suspend fun getCharactersByZone(zone: String, limit: Int = 50): List<CharacterInfo> = withContext(Dispatchers.IO) {
        characterDao.getCharactersByZone(zone, limit).map { it.toModel() }
    }

    suspend fun getRandomCharacters(count: Int, zone: String? = null): List<CharacterInfo> = withContext(Dispatchers.IO) {
        if (zone != null) {
            characterDao.getRandomCharactersByZone(zone, count)
        } else {
            characterDao.getRandomCharacters(count)
        }.map { it.toModel() }
    }

    suspend fun searchCharacters(query: String): List<CharacterInfo> = withContext(Dispatchers.IO) {
        characterDao.searchCharacters(query).map { it.toModel() }
    }

    suspend fun getCharactersByCode(code: String): List<CharacterInfo> = withContext(Dispatchers.IO) {
        characterDao.getCharactersByCode(code).map { it.toModel() }
    }

    suspend fun getCodeForCharacter(char: String, isWubi98: Boolean = false): String? = withContext(Dispatchers.IO) {
        characterDao.getCharacter(character = char)?.let {
            if (isWubi98) it.wubi98 else it.wubi86
        }
    }

    suspend fun isDatabaseInitialized(): Boolean = withContext(Dispatchers.IO) {
        characterDao.getCharacterCount() > 0
    }

    suspend fun initializeDatabase(characters: List<CharacterInfo>) = withContext(Dispatchers.IO) {
        characterDao.insertAll(characters.map { it.toEntity() })
    }

    private fun CharacterEntity.toModel(): CharacterInfo {
        return CharacterInfo(
            char = char,
            wubi86 = wubi86,
            wubi98 = wubi98,
            pinyin = pinyin,
            radical = radical,
            strokeCount = strokeCount,
            zone = zone,
            breakdown = gson.fromJson(breakdown, object : TypeToken<List<String>>() {}.type) ?: emptyList(),
            isLevel1Short = isLevel1Short,
            isLevel2Short = isLevel2Short,
            frequency = frequency
        )
    }

    private fun CharacterInfo.toEntity(): CharacterEntity {
        return CharacterEntity(
            char = char,
            wubi86 = wubi86,
            wubi98 = wubi98,
            pinyin = pinyin,
            radical = radical,
            strokeCount = strokeCount,
            zone = zone,
            breakdown = gson.toJson(breakdown),
            isLevel1Short = isLevel1Short,
            isLevel2Short = isLevel2Short,
            frequency = frequency
        )
    }
}