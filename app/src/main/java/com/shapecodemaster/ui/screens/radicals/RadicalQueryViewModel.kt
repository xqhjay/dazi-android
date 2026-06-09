package com.shapecodemaster.ui.screens.radicals

import androidx.lifecycle.ViewModel
import com.shapecodemaster.data.model.CharacterInfo
import com.shapecodemaster.data.repository.CharacterRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class RadicalQueryViewModel @Inject constructor(
    private val characterRepository: CharacterRepository
) : ViewModel() {

    suspend fun search(query: String): List<CharacterInfo> {
        return characterRepository.searchCharacters(query)
    }
}