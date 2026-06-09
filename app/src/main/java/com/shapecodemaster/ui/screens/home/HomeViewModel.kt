package com.shapecodemaster.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shapecodemaster.data.repository.PracticeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    practiceRepository: PracticeRepository
) : ViewModel() {

    val mistakeCount: StateFlow<Int> = practiceRepository.getMistakeCount()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0
        )

    val todayDuration: StateFlow<Long> = practiceRepository.getTodayPracticeDuration()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0L
        ).let { flow ->
            kotlinx.coroutines.flow.MutableStateFlow(0L).apply {
                viewModelScope.launch {
                    flow.collect { value ->
                        this@apply.value = value ?: 0L
                    }
                }
            }
        }
}