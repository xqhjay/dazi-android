package com.shapecodemaster.data.local.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.shapecodemaster.data.local.database.entity.CharacterEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CharacterDao {

    @Query("SELECT * FROM characters WHERE char = :char LIMIT 1")
    suspend fun getCharacter(character: String): CharacterEntity?

    @Query("SELECT * FROM characters WHERE zone = :zone ORDER BY frequency DESC LIMIT :limit")
    suspend fun getCharactersByZone(zone: String, limit: Int = 50): List<CharacterEntity>

    @Query("SELECT * FROM characters WHERE char IN (:chars)")
    suspend fun getCharactersByList(chars: List<String>): List<CharacterEntity>

    @Query("SELECT * FROM characters ORDER BY RANDOM() LIMIT :limit")
    suspend fun getRandomCharacters(limit: Int): List<CharacterEntity>

    @Query("SELECT * FROM characters WHERE zone = :zone ORDER BY RANDOM() LIMIT :limit")
    suspend fun getRandomCharactersByZone(zone: String, limit: Int): List<CharacterEntity>

    @Query("SELECT * FROM characters WHERE char LIKE '%' || :query || '%' OR pinyin LIKE '%' || :query || '%' LIMIT 20")
    suspend fun searchCharacters(query: String): List<CharacterEntity>

    @Query("SELECT COUNT(*) FROM characters")
    suspend fun getCharacterCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(characters: List<CharacterEntity>)

    @Query("SELECT * FROM characters WHERE wubi86 = :code OR wubi98 = :code LIMIT 10")
    suspend fun getCharactersByCode(code: String): List<CharacterEntity>
}