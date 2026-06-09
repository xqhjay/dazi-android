package com.shapecodemaster

import org.junit.Test
import org.junit.Assert.*

class ExampleUnitTest {
    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)
    }

    @Test
    fun wpmCalculation_isCorrect() {
        val calculator = com.shapecodemaster.utils.StatsCalculator
        val wpm = calculator.calculateWPM(120, 60000)
        assertEquals(120f, wpm, 0.1f)
    }

    @Test
    fun accuracyCalculation_isCorrect() {
        val calculator = com.shapecodemaster.utils.StatsCalculator
        val accuracy = calculator.calculateAccuracy(90, 100)
        assertEquals(90f, accuracy, 0.1f)
    }
}