<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import CreatePostModal from '../components/CreatePostModal.vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

// États de la vue
const isSidebarOpen = ref(false)
const isCreateModalOpen = ref(false)
const exercices = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Filtres locaux facultatifs (par année par exemple)
const filtreAnnee = ref('TOUS')

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
    exercices.value = data
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
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">Espace Entraide & Devoirs</h2>
            <p class="text-sm text-gray-500">Trouve de l'aide ou propose tes compétences sur les exercices bloquants.</p>
          </div>
          
          <button 
            @click="isCreateModalOpen = true"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition active:scale-95 flex items-center gap-2 shadow-sm"
          >
            <span>🙋‍♂️</span> Demander de l'aide
          </button>
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
          <article
            v-for="item in exercices"
            :key="item.id"
            class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                  {{ item.matiere?.titre || 'Exercice' }}
                </span>
                <span class="text-xs text-gray-400">{{ item.annee }}</span>
              </div>
              <span class="text-xs text-gray-400">❤️ {{ item.nbJaime }}</span>
            </div>

            <p class="text-gray-800 whitespace-pre-line">{{ item.description }}</p>

            <a
              v-if="item.lien"
              :href="item.lien"
              target="_blank"
              class="inline-block mt-2 text-sm text-blue-600 hover:underline"
            >
              Voir le lien
            </a>

            <p class="text-xs text-gray-400 mt-4">
              Par {{ item.utilisateur?.prenom }} {{ item.utilisateur?.nom }}
            </p>
          </article>
        </div>
      </main>
    </div>

    <CreatePostModal 
      :is-open="isCreateModalOpen" 
      @close="handleModalClose" 
    />
  </div>
</template>