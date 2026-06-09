package com.shapecodemaster.data.local.database.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "practice_records",
    indices = [Index(value = ["timestamp"])]
)
data class PracticeRecordEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val timestamp: Long,
    val type: String,
    val duration: Long,
    val totalChars: Int,
    val correctChars: Int,
    val wrongChars: Int,
    val backspaceCount: Int,
    val wpm: Float,
    val accuracy: Float
)