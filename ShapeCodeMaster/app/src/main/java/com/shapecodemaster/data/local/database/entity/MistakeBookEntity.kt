package com.shapecodemaster.data.local.database.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "mistake_book",
    indices = [Index(value = ["char"], unique = true)]
)
data class MistakeBookEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val char: String,
    val errorCount: Int,
    val lastErrorTime: Long,
    val correctCode: String,
    val zone: String
)