package com.shapecodemaster.data.local.database.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "characters",
    indices = [
        Index(value = ["zone"]),
        Index(value = ["char"], unique = true)
    ]
)
data class CharacterEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val char: String,
    val wubi86: String,
    val wubi98: String,
    val pinyin: String,
    val radical: String,
    val strokeCount: Int,
    val zone: String,
    val breakdown: String,
    val isLevel1Short: Boolean,
    val isLevel2Short: Boolean,
    val frequency: Int
)