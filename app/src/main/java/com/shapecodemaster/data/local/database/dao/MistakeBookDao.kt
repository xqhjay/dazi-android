package com.shapecodemaster.data.local.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.shapecodemaster.data.local.database.entity.MistakeBookEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MistakeBookDao {

    @Query("SELECT * FROM mistake_book ORDER BY errorCount DESC, lastErrorTime DESC")
    fun getAllMistakes(): Flow<List<MistakeBookEntity>>

    @Query("SELECT * FROM mistake_book ORDER BY errorCount DESC, lastErrorTime DESC LIMIT :limit")
    suspend fun getMistakes(limit: Int = 50): List<MistakeBookEntity>

    @Query("SELECT * FROM mistake_book WHERE char = :char LIMIT 1")
    suspend fun getMistakeByChar(character: String): MistakeBookEntity?

    @Query("SELECT COUNT(*) FROM mistake_book")
    fun getMistakeCount(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(mistake: MistakeBookEntity)

    @Update
    suspend fun update(mistake: MistakeBookEntity)

    @Query("DELETE FROM mistake_book WHERE char = :char")
    suspend fun deleteByChar(character: String)

    @Query("DELETE FROM mistake_book")
    suspend fun deleteAll()

    @Query("UPDATE mistake_book SET errorCount = errorCount + 1, lastErrorTime = :timestamp WHERE char = :char")
    suspend fun incrementErrorCount(character: String, timestamp: Long = System.currentTimeMillis())
}