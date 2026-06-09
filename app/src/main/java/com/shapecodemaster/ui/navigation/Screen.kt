package com.shapecodemaster.ui.navigation

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Practice : Screen("practice/{type}/{zone}") {
        fun createRoute(type: String, zone: String = "all") = "practice/$type/$zone"
    }
    data object PracticeResult : Screen("practice_result")
    data object RadicalTable : Screen("radical_table")
    data object RadicalQuery : Screen("radical_query")
    data object Stats : Screen("stats")
    data object Settings : Screen("settings")
    data object MistakeBook : Screen("mistake_book")
}