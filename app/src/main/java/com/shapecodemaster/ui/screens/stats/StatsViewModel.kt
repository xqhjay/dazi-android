package com.shapecodemaster.ui.screens.stats

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shapecodemaster.data.local.database.entity.PracticeRecordEntity
import com.shapecodemaster.data.repository.PracticeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class StatsViewModel @Inject constructor(
    practiceRepository: PracticeRepository
) : ViewModel() {

    val recentRecords: StateFlow<List<PracticeRecordEntity>> = practiceRepository.getRecentRecords(100)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val bestWpm: StateFlow<Float?> = practiceRepository.getBestWpm()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0f
        )

    val avgAccuracy: StateFlow<Float?> = practiceRepository.getAverageAccuracy()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0f
        )

    val totalChars: StateFlow<Int?> = practiceRepository.getTotalCharactersTyped()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0
        )

    val todayDuration: StateFlow<Long?> = practiceRepository.getTodayPracticeDuration()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0L
        )
}