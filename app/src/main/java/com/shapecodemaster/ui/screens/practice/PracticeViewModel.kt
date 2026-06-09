package com.shapecodemaster.ui.screens.practice

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shapecodemaster.data.model.CharacterInfo
import com.shapecodemaster.data.model.CodeTableType
import com.shapecodemaster.data.model.PracticeResult
import com.shapecodemaster.data.model.PracticeType
import com.shapecodemaster.data.repository.CharacterRepository
import com.shapecodemaster.data.repository.PracticeRepository
import com.shapecodemaster.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PracticeUiState(
    val isLoading: Boolean = true,
    val targetText: String = "",
    val inputText: String = "",
    val currentIndex: Int = 0,
    val wpm: Float = 0f,
    val accuracy: Float = 100f,
    val elapsedTime: Long = 0L,
    val isFinished: Boolean = false,
    val showHint: Boolean = false,
    val hintText: String = "",
    val mistakeCount: Int = 0,
    val backspaceCount: Int = 0,
    val currentCharInfo: CharacterInfo? = null,
    val isPaused: Boolean = false,
    val totalChars: Int = 0,
    val correctChars: Int = 0
)

@HiltViewModel
class PracticeViewModel @Inject constructor(
    private val characterRepository: CharacterRepository,
    private val practiceRepository: PracticeRepository,
    private val settingsRepository: SettingsRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(PracticeUiState())
    val uiState: StateFlow<PracticeUiState> = _uiState.asStateFlow()

    private var timerJob: Job? = null
    private var startTime: Long = 0L
    private val mistakeChars = mutableListOf<String>()
    private var isWubi98 = false

    private val practiceType: String = savedStateHandle.get<String>("type") ?: "single"
    private val zoneFilter: String = savedStateHandle.get<String>("zone") ?: "all"

    init {
        viewModelScope.launch {
            isWubi98 = settingsRepository.codeTableType.first() == CodeTableType.WUBI_98
            loadPracticeContent()
        }
    }

    private fun loadPracticeContent() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            val characters = when (practiceType) {
                "single" -> {
                    if (zoneFilter != "all") {
                        characterRepository.getRandomCharacters(20, zoneFilter)
                    } else {
                        characterRepository.getRandomCharacters(20)
                    }
                }
                "phrase" -> characterRepository.getRandomCharacters(30)
                "sentence" -> characterRepository.getRandomCharacters(50)
                "mistake" -> {
                    val mistakes = practiceRepository.getMistakes(20)
                    mistakes.mapNotNull {
                        characterRepository.getCharacterInfo(it.char)
                    }
                }
                else -> characterRepository.getRandomCharacters(20)
            }

            val targetText = characters.joinToString("") { it.char }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                targetText = targetText,
                totalChars = targetText.length,
                currentCharInfo = characters.firstOrNull()
            )

            startTimer()
        }
    }

    private fun startTimer() {
        startTime = System.currentTimeMillis()
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (!_uiState.value.isFinished && !_uiState.value.isPaused) {
                delay(1000)
                val elapsed = System.currentTimeMillis() - startTime
                val state = _uiState.value
                val wpm = if (elapsed > 0) {
                    (state.correctChars * 60000f / elapsed)
                } else 0f

                _uiState.value = state.copy(
                    elapsedTime = elapsed,
                    wpm = wpm
                )
            }
        }
    }

    fun onKeyPress(key: String) {
        val state = _uiState.value
        if (state.isFinished || state.isPaused) return

        val currentChar = state.targetText.getOrNull(state.currentIndex)?.toString() ?: return
        val expectedCode = if (isWubi98) state.currentCharInfo?.wubi98 else state.currentCharInfo?.wubi86

        viewModelScope.launch {
            if (key == currentChar || key.equals(expectedCode, ignoreCase = true)) {
                // Correct input
                val newIndex = state.currentIndex + 1
                val newCorrectChars = state.correctChars + 1
                val newAccuracy = if (state.totalChars > 0) {
                    (newCorrectChars.toFloat() / state.totalChars * 100)
                } else 100f

                val nextChar = state.targetText.getOrNull(newIndex)?.toString()
                val nextCharInfo = nextChar?.let { characterRepository.getCharacterInfo(it) }

                _uiState.value = state.copy(
                    currentIndex = newIndex,
                    correctChars = newCorrectChars,
                    accuracy = newAccuracy,
                    showHint = false,
                    currentCharInfo = nextCharInfo
                )

                if (newIndex >= state.targetText.length) {
                    finishPractice()
                }
            } else {
                // Wrong input
                val newMistakeCount = state.mistakeCount + 1
                if (!mistakeChars.contains(currentChar)) {
                    mistakeChars.add(currentChar)
                }

                val charInfo = characterRepository.getCharacterInfo(currentChar)
                val code = if (isWubi98) charInfo?.wubi98 else charInfo?.wubi86
                val breakdown = charInfo?.breakdown?.joinToString(" + ") ?: ""

                _uiState.value = state.copy(
                    mistakeCount = newMistakeCount,
                    showHint = true,
                    hintText = "正确编码: ${code ?: ""}\n拆字: $breakdown"
                )

                // Auto hide hint after 2 seconds
                delay(2000)
                _uiState.value = _uiState.value.copy(showHint = false)
            }
        }
    }

    fun onBackspace() {
        val state = _uiState.value
        if (state.isFinished || state.isPaused || state.currentIndex <= 0) return

        _uiState.value = state.copy(
            currentIndex = state.currentIndex - 1,
            backspaceCount = state.backspaceCount + 1,
            showHint = false
        )
    }

    private fun finishPractice() {
        timerJob?.cancel()
        val state = _uiState.value
        val duration = System.currentTimeMillis() - startTime

        _uiState.value = state.copy(
            isFinished = true,
            elapsedTime = duration
        )

        viewModelScope.launch {
            val result = PracticeResult(
                type = when (practiceType) {
                    "single" -> PracticeType.SINGLE_CHAR
                    "phrase" -> PracticeType.PHRASE
                    "sentence" -> PracticeType.SENTENCE
                    "mistake" -> PracticeType.MISTAKE
                    else -> PracticeType.SINGLE_CHAR
                },
                duration = duration,
                totalChars = state.totalChars,
                correctChars = state.correctChars,
                wrongChars = state.mistakeCount,
                backspaceCount = state.backspaceCount,
                wpm = state.wpm,
                accuracy = state.accuracy,
                mistakeChars = mistakeChars.toList()
            )

            practiceRepository.savePracticeResult(result)

            // Save mistakes
            mistakeChars.forEach { char ->
                val charInfo = characterRepository.getCharacterInfo(char)
                val code = if (isWubi98) charInfo?.wubi98 else charInfo?.wubi86
                practiceRepository.addMistake(
                    char = char,
                    correctCode = code ?: "",
                    zone = charInfo?.zone ?: ""
                )
            }
        }
    }

    fun pausePractice() {
        _uiState.value = _uiState.value.copy(isPaused = true)
        timerJob?.cancel()
    }

    fun resumePractice() {
        _uiState.value = _uiState.value.copy(isPaused = false)
        startTimer()
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
    }
}