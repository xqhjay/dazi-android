package com.shapecodemaster.data.repository

import com.shapecodemaster.data.local.database.dao.MistakeBookDao
import com.shapecodemaster.data.local.database.dao.PracticeRecordDao
import com.shapecodemaster.data.local.database.entity.MistakeBookEntity
import com.shapecodemaster.data.local.database.entity.PracticeRecordEntity
import com.shapecodemaster.data.model.PracticeResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.util.Calendar
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PracticeRepository @Inject constructor(
    private val practiceRecordDao: PracticeRecordDao,
    private val mistakeBookDao: MistakeBookDao
) {

    fun getRecentRecords(limit: Int = 100): Flow<List<PracticeRecordEntity>> {
        return practiceRecordDao.getRecentRecords(limit)
    }

    fun getAllRecords(): Flow<List<PracticeRecordEntity>> {
        return practiceRecordDao.getAllRecords()
    }

    fun getTodayPracticeDuration(): Flow<Long?> {
        val startOfDay = getStartOfDay()
        return practiceRecordDao.getTodayPracticeDuration(startOfDay)
    }

    fun getBestWpm(): Flow<Float?> {
        return practiceRecordDao.getBestWpm()
    }

    fun getAverageAccuracy(): Flow<Float?> {
        return practiceRecordDao.getAverageAccuracy()
    }

    fun getTotalCharactersTyped(): Flow<Int?> {
        return practiceRecordDao.getTotalCharactersTyped()
    }

    suspend fun savePracticeResult(result: PracticeResult) = withContext(Dispatchers.IO) {
        val entity = PracticeRecordEntity(
            timestamp = result.timestamp,
            type = result.type.name,
            duration = result.duration,
            totalChars = result.totalChars,
            correctChars = result.correctChars,
            wrongChars = result.wrongChars,
            backspaceCount = result.backspaceCount,
            wpm = result.wpm,
            accuracy = result.accuracy
        )
        practiceRecordDao.insert(entity)
    }

    suspend fun addMistake(char: String, correctCode: String, zone: String) = withContext(Dispatchers.IO) {
        val existing = mistakeBookDao.getMistakeByChar(character = char)
        if (existing != null) {
            mistakeBookDao.incrementErrorCount(character = char)
        } else {
            mistakeBookDao.insert(
                MistakeBookEntity(
                    char = char,
                    errorCount = 1,
                    lastErrorTime = System.currentTimeMillis(),
                    correctCode = correctCode,
                    zone = zone
                )
            )
        }
    }

    fun getAllMistakes(): Flow<List<MistakeBookEntity>> {
        return mistakeBookDao.getAllMistakes()
    }

    suspend fun getMistakes(limit: Int = 50): List<MistakeBookEntity> = withContext(Dispatchers.IO) {
        mistakeBookDao.getMistakes(limit)
    }

    suspend fun clearMistakeBook() = withContext(Dispatchers.IO) {
        mistakeBookDao.deleteAll()
    }

    suspend fun removeMistake(char: String) = withContext(Dispatchers.IO) {
        mistakeBookDao.deleteByChar(character = char)
    }

    fun getMistakeCount(): Flow<Int> {
        return mistakeBookDao.getMistakeCount()
    }

    private fun getStartOfDay(): Long {
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }
}