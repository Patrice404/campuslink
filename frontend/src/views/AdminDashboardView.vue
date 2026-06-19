<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

// Nettoyage de l'URL comme validé ensemble pour éviter le double slash
const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

interface User {
  id: string
  prenom: string
  nom: string
  email: string
  role: string
  photoProfil?: string
}

interface Stats {
  totalUtilisateurs: number
  signalementsEnAttente: number
}

// États réactifs
const users = ref<User[]>([])
const stats = ref<Stats>({ totalUtilisateurs: 0, signalementsEnAttente: 0 })
const isLoading = ref(true)
const errorMessage = ref('')

// Fonction globale pour récupérer les données de l'API Admin
const fetchAdminData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // Récupération dynamique du token (depuis le store ou le localStorage)
    const token = authStore.token || localStorage.getItem('token')
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    // 1. Récupération des statistiques
    const statsResponse = await fetch(`${apiUrl}/api/admin/statistiques`, { headers })
    if (!statsResponse.ok) {
      if (statsResponse.status === 403) throw new Error("Accès interdit. Vous n'êtes pas administrateur.")
      throw new Error(`Erreur HTTP Stats: ${statsResponse.status}`)
    }
    const statsData = await statsResponse.json()
    stats.value = statsData.stats

    // 2. Récupération des utilisateurs
    const usersResponse = await fetch(`${apiUrl}/api/admin/utilisateurs`, { headers })
    if (!usersResponse.ok) throw new Error(`Erreur HTTP Users: ${usersResponse.status}`)
    const usersData = await usersResponse.json()
    users.value = usersData

  } catch (error: any) {
    console.error("Erreur d'administration :", error)
    errorMessage.value = error.message || "Impossible de charger les données du panneau d'administration."
  } finally {
    isLoading.value = false
  }
}

// Fonction pour bannir/supprimer un utilisateur
const handleBanUser = async (userId: string, userStringName: string) => {
  if (!confirm(`Êtes-vous absolument sûr de vouloir supprimer définitivement le compte de ${userStringName} ? Cette action est irréversible.`)) {
    return
  }

  try {
    const token = authStore.token || localStorage.getItem('token')
    const response = await fetch(`${apiUrl}/api/admin/utilisateurs/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || "Erreur lors de la suppression de l'utilisateur.")
    }

    // Mise à jour réactive de l'interface sans recharger la page
    users.value = users.value.filter(user => user.id !== userId)
    stats.value.totalUtilisateurs -= 1
    
    alert("L'utilisateur a été supprimé avec succès.")
  } catch (error: any) {
    alert(`Erreur : ${error.message}`)
  }
}

onMounted(() => {
  fetchAdminData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto mb-8">
      <h1 class="text-3xl font-extrabold text-gray-900">Cockpit d'Administration</h1>
      <p class="text-gray-600 mt-1">Gérez les accès de la plateforme CampusLink et supervisez la communauté.</p>
    </div>

    <div class="max-w-7xl mx-auto">
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
        <p class="font-semibold text-lg">{{ errorMessage }}</p>
        <p class="text-sm text-red-500 mt-1">Vérifiez que votre compte possède bien le rôle "ADMIN" dans la base de données.</p>
        <button @click="fetchAdminData" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
          Réessayer
        </button>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Membres inscrits</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.totalUtilisateurs }}</p>
            </div>
            <div class="p-3 bg-indigo-50 text-indigo-600 rounded-lg text-xl font-bold">👥</div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Modération / Signalements</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.signalementsEnAttente }}</p>
            </div>
            <div class="p-3 bg-amber-50 text-amber-600 rounded-lg text-xl font-bold">⚠️</div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 class="text-lg font-bold text-gray-900">Liste des utilisateurs enregistrés</h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th class="px-6 py-3">Utilisateur</th>
                  <th class="px-6 py-3">Email</th>
                  <th class="px-6 py-3">Rôle</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 text-sm">
                <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50/70 transition">
                  <td class="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 uppercase overflow-hidden">
                      <img v-if="user.photoProfil" :src="user.photoProfil" alt="Profil" class="w-full h-full object-cover">
                      <span v-else>{{ user.prenom[0] }}{{ user.nom[0] }}</span>
                    </div>
                    <span>{{ user.prenom }} {{ user.nom }}</span>
                  </td>
                  
                  <td class="px-6 py-4 text-gray-600">{{ user.email }}</td>
                  
                  <td class="px-6 py-4">
                    <span :class="{
                      'bg-purple-50 text-purple-700 border-purple-100': user.role === 'ADMIN',
                      'bg-blue-50 text-blue-700 border-blue-100': user.role === 'PROFESSEUR',
                      'bg-gray-50 text-gray-700 border-gray-100': user.role === 'ETUDIANT'
                    }" class="px-2 py-1 text-xs font-semibold rounded-md border">
                      {{ user.role }}
                    </span>
                  </td>
                  
                  <td class="px-6 py-4 text-right">
                    <button 
                      v-if="user.role !== 'ADMIN'"
                      @click="handleBanUser(user.id, `${user.prenom} ${user.nom}`)"
                      class="text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 transition"
                    >
                      Bannir / Supprimer
                    </button>
                    <span v-else class="text-xs text-gray-400 italic">Inviolable</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="users.length === 0" class="text-center py-12 text-gray-500">
            Aucun utilisateur trouvé dans la base de données.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>