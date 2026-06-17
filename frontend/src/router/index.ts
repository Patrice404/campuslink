import { createRouter, createWebHistory } from 'vue-router'
import CampusSelectView from '../views/CampusSelectView.vue' // <-- Nouvelle page
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileView from '../views/ProfileView.vue'
import EntraideView from '../views/EntraideView.vue'
import CampusView from '../views/CampusView.vue'
import OpportunitesView from '../views/OpportunitesView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 1. La racine (/) devient la sélection du campus
    {
      path: '/',
      name: 'campus-select',
      component: CampusSelectView,
      meta: { hideNavbar: true }
    },
    // 2. La page de connexion
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { hideNavbar: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { hideNavbar: true }
    },
    // 3. L'accueil du site (Une fois connecté)
    {
      path: '/home',
      name: 'home',
      component: HomeView
    },
    {
      path: '/projets',
      name: 'projects',
      component: ProjectsView
    },
    // La page profile utilisateur (id optionnel pour consulter un autre profil)
    {
      path: '/profil/:id?',
      name: 'profil',
      component: ProfileView
    },
    // La page d'entraide
    {
      path: '/entraide',
      name: 'entraide',
      component: EntraideView
    },
    {
      path: '/campus',
      name: 'campus',
      component: CampusView
    },
    {
      path: '/opportunites',
      name: 'opportunites',
      component: OpportunitesView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
  ]
})

export default router
