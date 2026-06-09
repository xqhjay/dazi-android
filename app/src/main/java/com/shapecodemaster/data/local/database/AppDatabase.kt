package com.shapecodemaster.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.shapecodemaster.data.local.database.dao.CharacterDao
import com.shapecodemaster.data.local.database.dao.MistakeBookDao
import com.shapecodemaster.data.local.database.dao.PracticeRecordDao
import com.shapecodemaster.data.local.database.entity.CharacterEntity
import com.shapecodemaster.data.local.database.entity.MistakeBookEntity
import com.shapecodemaster.data.local.database.entity.PracticeRecordEntity

@Database(
    entities = [
        CharacterEntity::class,
        PracticeRecordEntity::class,
        MistakeBookEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun characterDao(): CharacterDao
    abstract fun practiceRecordDao(): PracticeRecordDao
    abstract fun mistakeBookDao(): MistakeBookDao
}