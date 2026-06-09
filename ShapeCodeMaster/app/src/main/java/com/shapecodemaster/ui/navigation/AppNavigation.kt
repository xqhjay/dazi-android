package com.shapecodemaster.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.shapecodemaster.R
import com.shapecodemaster.ui.screens.home.HomeScreen
import com.shapecodemaster.ui.screens.practice.PracticeResultScreen
import com.shapecodemaster.ui.screens.practice.PracticeScreen
import com.shapecodemaster.ui.screens.radicals.RadicalQueryScreen
import com.shapecodemaster.ui.screens.radicals.RadicalTableScreen
import com.shapecodemaster.ui.screens.settings.SettingsScreen
import com.shapecodemaster.ui.screens.stats.StatsScreen

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val bottomNavItems = listOf(
        BottomNavItem.Home,
        BottomNavItem.Radicals,
        BottomNavItem.Stats,
        BottomNavItem.Settings
    )

    val showBottomBar = bottomNavItems.any { it.route == currentDestination?.route }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) },
                            selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToPractice = { type, zone ->
                        navController.navigate(Screen.Practice.createRoute(type, zone))
                    },
                    onNavigateToMistakeBook = {
                        navController.navigate(Screen.MistakeBook.route)
                    },
                    onNavigateToRadicalTable = {
                        navController.navigate(Screen.RadicalTable.route)
                    }
                )
            }

            composable(
                route = Screen.Practice.route,
                arguments = listOf(
                    navArgument("type") { type = NavType.StringType },
                    navArgument("zone") { type = NavType.StringType }
                )
            ) { backStackEntry ->
                val type = backStackEntry.arguments?.getString("type") ?: "single"
                val zone = backStackEntry.arguments?.getString("zone") ?: "all"
                PracticeScreen(
                    practiceType = type,
                    zoneFilter = zone,
                    onNavigateBack = { navController.popBackStack() },
                    onPracticeComplete = { result ->
                        navController.currentBackStackEntry?.savedStateHandle?.set("result", result)
                        navController.navigate(Screen.PracticeResult.route)
                    }
                )
            }

            composable(Screen.PracticeResult.route) {
                val result = navController.previousBackStackEntry?.savedStateHandle?.get<com.shapecodemaster.data.model.PracticeResult>("result")
                PracticeResultScreen(
                    result = result,
                    onNavigateHome = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
                        }
                    },
                    onPracticeAgain = {
                        navController.popBackStack()
                    }
                )
            }

            composable(Screen.RadicalTable.route) {
                RadicalTableScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToQuery = {
                        navController.navigate(Screen.RadicalQuery.route)
                    }
                )
            }

            composable(Screen.RadicalQuery.route) {
                RadicalQueryScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Stats.route) {
                StatsScreen()
            }

            composable(Screen.Settings.route) {
                SettingsScreen()
            }

            composable(Screen.MistakeBook.route) {
                HomeScreen(
                    onNavigateToPractice = { type, zone ->
                        navController.navigate(Screen.Practice.createRoute(type, zone))
                    },
                    onNavigateToMistakeBook = {},
                    onNavigateToRadicalTable = {}
                )
            }
        }
    }
}

sealed class BottomNavItem(val route: String, val icon: androidx.compose.ui.graphics.vector.ImageVector, val label: String) {
    data object Home : BottomNavItem(Screen.Home.route, Icons.Default.Home, "练习")
    data object Radicals : BottomNavItem(Screen.RadicalTable.route, Icons.Default.Star, "字根")
    data object Stats : BottomNavItem(Screen.Stats.route, Icons.Default.Timer, "统计")
    data object Settings : BottomNavItem(Screen.Settings.route, Icons.Default.Settings, "设置")
}