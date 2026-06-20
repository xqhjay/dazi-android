import { createRouter, createWebHistory } from 'vue-router'
import PracticeView from './views/PracticeView.vue'
import StatsView from './views/StatsView.vue'
import CharSetsView from './views/CharSetsView.vue'
import ProfileView from './views/ProfileView.vue'
import GameView from './views/GameView.vue'

const routes = [
  { path: '/', component: PracticeView, meta: { showTabBar: true } },
  { path: '/stats', component: StatsView, meta: { showTabBar: true } },
  { path: '/char-sets', component: CharSetsView, meta: { showTabBar: true } },
  { path: '/profile', component: ProfileView, meta: { showTabBar: true } },
  { path: '/game/:mode', component: GameView, meta: { showTabBar: false } }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
