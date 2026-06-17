<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SidebarNav from './SidebarNav.vue'
import TopNav from './TopNav.vue'
import CreatePostModal from './CreatePostModal.vue'
import AnnonceCard from './AnnonceCard.vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

// 1. Définition des propriétés dynamiques (Props)
const props = defineProps({
  pageTitle: { type: String, required: true },
  pageSubtitle: { type: String, required: true },
  apiEndpoint: { type: String, required: true }, // ex: 'entraide', 'projet', 'bonplan'
  cardType: { type: String, required: true },    // ex: 'AnnonceExercice', 'AnnonceProjet'
  fallbackCardTitle: { type: String, default: 'Publication' },
  emptyStateEmoji: { type: String, default: '🎉' },
  emptyStateTitle: { type: String, default: 'Aucune publication !' },
  emptyStateSubtitle: { type: String, default: 'Le fil est vide pour le moment.' }
})

// États de la vue
const isSidebarOpen = ref(false)
const isCreateModalOpen = ref(false)
const annonces = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

const fetchAnnonces = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    // Utilisation de la prop apiEndpoint
    const response = await fetch(`${apiUrl}/api/${props.apiEndpoint}`, {
      method: 'GET',
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
      }
    })
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }

    const data = await response.json()
    
    // Normalisation générique des données pour AnnonceCard
    annonces.value = data.map((item: any) => ({
      ...item,
      type: props.cardType, // Prop dynamique
      auteur: item.utilisateur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 },
      titre: item.titre || item.matiere?.titre || props.fallbackCardTitle,
      texte: item.texte || item.description
    }))
  } catch (error) {
    console.error(`Erreur lors du chargement de ${props.apiEndpoint}:`, error)
    errorMessage.value = "Impossible de charger le fil d'actualité. Vérifie ta connexion."
  } finally {
    isLoading.value = false
  }
}

const handleModalClose = () => {
  isCreateModalOpen.value = false
  fetchAnnonces()
}

onMounted(() => {
  fetchAnnonces()
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
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">{{ pageTitle }}</h2>
          <p class="text-sm text-gray-500">{{ pageSubtitle }}</p>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
          <p class="text-gray-500 text-sm">Chargement en cours...</p>
        </div>

        <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {{ errorMessage }}
        </div>

        <div v-else-if="annonces.length === 0" class="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
          <span class="text-4xl">{{ emptyStateEmoji }}</span>
          <h3 class="text-lg font-bold text-gray-800 mt-2">{{ emptyStateTitle }}</h3>
          <p class="text-gray-500 text-sm mt-1">{{ emptyStateSubtitle }}</p>
        </div>

        <div v-else class="space-y-4">
          <AnnonceCard 
            v-for="item in annonces" 
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