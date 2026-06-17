<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import CreatePostModal from '../components/CreatePostModal.vue'
import AnnonceCard from '../components/AnnonceCard.vue' // <-- Réimport du composant réactif
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

// États de la vue
const isSidebarOpen = ref(false)
const isCreateModalOpen = ref(false)
const exercices = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Récupération des données depuis l'API
const fetchExercices = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/entraide`, {
      method: 'GET',
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
      }
    })
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }

    const data = await response.json()
    console.log('Exercices reçus:', data, 'count =', data.length)
    
    // On mappe les données reçues pour s'assurer qu'elles correspondent à ce qu'attend AnnonceCard
    exercices.value = data.map((item: any) => {
      return {
        ...item,
        // Forcer le type visuel pour que AnnonceCard mette la bonne couleur/icône
        type: 'AnnonceExercice',
        // AnnonceCard s'attend à recevoir la propriété "auteur" plutôt que "utilisateur"
        auteur: item.utilisateur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 },
        // Si le titre n'existe pas directement au premier niveau, on utilise celui de la matière ou une valeur par défaut
        titre: item.titre || item.matiere?.titre || 'Exercice d\'entraide',
        // Assure que le texte principal est lié à la description ou au texte
        texte: item.texte || item.description
      }
    })
  } catch (error) {
    console.error('Erreur entraide:', error)
    errorMessage.value = "Impossible de charger le fil d'entraide. Vérifie ta connexion."
  } finally {
    isLoading.value = false
  }
}

// Rafraîchir la liste après une publication réussie dans la modale
const handleModalClose = () => {
  isCreateModalOpen.value = false
  fetchExercices()
}

onMounted(() => {
  fetchExercices()
})
</script>

<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <SidebarNav :is-open="isSidebarOpen" @close="isSidebarOpen = false" />

    <div class="flex-1 flex flex-col overflow-hidden">
      <TopNav 
        @open-menu="isSidebarOpen = true" 
        @open-create-modal="isCreateModalOpen = true" 
      />

      <main class="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl w-full mx-auto">
        
        <div class="mb-6">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">Espace Entraide & Devoirs</h2>
          <p class="text-sm text-gray-500">Trouve de l'aide ou propose tes compétences sur les exercices bloquants.</p>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
          <p class="text-gray-500 text-sm">Chargement des exercices en cours...</p>
        </div>

        <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {{ errorMessage }}
        </div>

        <div v-else-if="exercices.length === 0" class="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
          <span class="text-4xl">🎉</span>
          <h3 class="text-lg font-bold text-gray-800 mt-2">Aucun exercice en souffrance !</h3>
          <p class="text-gray-500 text-sm mt-1">Tout le monde est à jour, ou c'est le moment idéal pour poser ta première question.</p>
        </div>

        <div v-else class="space-y-4">
          <AnnonceCard 
            v-for="item in exercices" 
            :key="item.id" 
            :annonce="item" 
          />
        </div>
      </main>
    </div>

    <CreatePostModal 
      :is-open="isCreateModalOpen" 
      @close="handleModalClose" 
    />
  </div>
</template>