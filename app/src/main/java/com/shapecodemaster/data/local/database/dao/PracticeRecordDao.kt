package com.shapecodemaster.data.local.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.shapecodemaster.data.local.database.entity.PracticeRecordEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PracticeRecordDao {

    @Query("SELECT * FROM practice_records ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentRecords(limit: Int = 100): Flow<List<PracticeRecordEntity>>

    @Query("SELECT * FROM practice_records WHERE timestamp >= :startTime ORDER BY timestamp DESC")
    fun getRecordsSince(startTime: Long): Flow<List<PracticeRecordEntity>>

    @Query("SELECT * FROM practice_records ORDER BY timestamp DESC")
    fun getAllRecords(): Flow<List<PracticeRecordEntity>>

    @Query("SELECT COUNT(*) FROM practice_records")
    fun getTotalPracticeCount(): Flow<Int>

    @Query("SELECT SUM(duration) FROM practice_records WHERE timestamp >= :startOfDay")
    fun getTodayPracticeDuration(startOfDay: Long): Flow<Long?>

    @Query("SELECT MAX(wpm) FROM practice_records")
    fun getBestWpm(): Flow<Float?>

    @Query("SELECT AVG(accuracy) FROM practice_records")
    fun getAverageAccuracy(): Flow<Float?>

    @Query("SELECT SUM(totalChars) FROM practice_records")
    fun getTotalCharactersTyped(): Flow<Int?>

    @Insert
    suspend fun insert(record: PracticeRecordEntity): Long

    @Query("DELETE FROM practice_records")
    suspend fun deleteAll()
}