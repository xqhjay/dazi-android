package com.shapecodemaster.data.repository

import com.shapecodemaster.data.local.datastore.SettingsDataStore
import com.shapecodemaster.data.model.CodeTableType
import com.shapecodemaster.data.model.ThemeMode
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    private val settingsDataStore: SettingsDataStore
) {

    val codeTableType: Flow<CodeTableType> = settingsDataStore.codeTableType

    val themeMode: Flow<ThemeMode> = settingsDataStore.themeMode

    suspend fun setCodeTableType(type: CodeTableType) {
        settingsDataStore.setCodeTableType(type)
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        settingsDataStore.setThemeMode(mode)
    }
}