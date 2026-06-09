package com.shapecodemaster.data.local.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.shapecodemaster.data.model.CodeTableType
import com.shapecodemaster.data.model.ThemeMode
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

@Singleton
class SettingsDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    companion object {
        val CODE_TABLE = stringPreferencesKey("code_table")
        val THEME_MODE = stringPreferencesKey("theme_mode")
    }

    val codeTableType: Flow<CodeTableType> = dataStore.data.map { preferences ->
        when (preferences[CODE_TABLE]) {
            "wubi98" -> CodeTableType.WUBI_98
            else -> CodeTableType.WUBI_86
        }
    }

    val themeMode: Flow<ThemeMode> = dataStore.data.map { preferences ->
        when (preferences[THEME_MODE]) {
            "light" -> ThemeMode.LIGHT
            "dark" -> ThemeMode.DARK
            else -> ThemeMode.SYSTEM
        }
    }

    suspend fun setCodeTableType(type: CodeTableType) {
        dataStore.edit { preferences ->
            preferences[CODE_TABLE] = when (type) {
                CodeTableType.WUBI_86 -> "wubi86"
                CodeTableType.WUBI_98 -> "wubi98"
            }
        }
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { preferences ->
            preferences[THEME_MODE] = when (mode) {
                ThemeMode.LIGHT -> "light"
                ThemeMode.DARK -> "dark"
                ThemeMode.SYSTEM -> "system"
            }
        }
    }
}