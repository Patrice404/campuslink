<script setup lang="ts">
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue'
import SidebarNav from './SidebarNav.vue'
import TopNav from './TopNav.vue'
import CreatePostModal from './CreatePostModal.vue'
import AnnonceCard from './AnnonceCard.vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const MAX_ANNONCES_PER_PAGE = 10 // Nombre d'annonces à charger par page (pour la pagination)
const props = defineProps({
  pageTitle: { type: String, required: true },
  pageSubtitle: { type: String, required: true },
  apiEndpoint: { type: String, required: true },
  cardType: { type: String, required: true },
  fallbackCardTitle: { type: String, default: 'Publication' },
  emptyStateEmoji: { type: String, default: '🎉' },
  emptyStateTitle: { type: String, default: 'Aucune publication !' },
  emptyStateSubtitle: { type: String, default: 'Le fil est vide pour le moment.' }
})

// États de la vue
const isSidebarOpen = ref(false)
const isCreateModalOpen = ref(false)
const annonces = ref<any[]>([])

// NOUVEAUX ÉTATS POUR LA PAGINATION
const page = ref(1)
const hasMore = ref(true)
const isLoading = ref(true)       // Uniquement pour le TOUT PREMIER chargement
const isLoadingMore = ref(false)   // Pour les chargements au scroll en bas de page
const errorMessage = ref<string | null>(null)

// Référence vers l'élément HTML tout en bas de la page
const loadMoreTrigger = useTemplateRef<HTMLElement>('loadMoreTrigger')
let observer: IntersectionObserver | null = null

const fetchAnnonces = async (isRefresh = false) => {
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  errorMessage.value = null
  
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    // AJOUT : On passe la page actuelle dans la requête URL
    const response = await fetch(`${apiUrl}/api/${props.apiEndpoint}?page=${page.value}`, {
      method: 'GET',
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
      }
    })
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }

    const data = await response.json()
    
    // Formatage classique des nouvelles lignes
    const nouvellesAnnonces = data.map((item: any) => ({
      ...item,
      type: props.cardType,
      auteur: item.utilisateur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 },
      titre: item.titre || item.matiere?.titre || props.fallbackCardTitle,
      texte: item.texte || item.description
    }))

    // STRATÉGIE DE FUSION :
    if (isRefresh) {
      annonces.value = nouvellesAnnonces // Si reset (ex: pull to refresh / publication), on écrase tout
    } else {
      annonces.value.push(...nouvellesAnnonces) // Sinon au scroll, on AJOUTE à la suite
    }

    // Si le backend renvoie moins de 10 éléments, c'est qu'il n'y a plus rien après
    if (data.length < MAX_ANNONCES_PER_PAGE) {
      hasMore.value = false
    }

  } catch (error) {
    console.error(`Erreur lors du chargement de ${props.apiEndpoint}:`, error)
    errorMessage.value = "Impossible de charger les données."
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// Configuration du détecteur de bas de page (IntersectionObserver)
const setupIntersectionObserver = () => {
  observer = new IntersectionObserver(async (entries) => {
    const trigger = entries[0]
    
    // Si la balise invisible entre dans l'écran ET qu'il reste des choses à charger
    if (trigger.isIntersecting && hasMore.value && !isLoading.value && !isLoadingMore.value) {
      page.value++ // On passe à la page suivante
      await fetchAnnonces() // On charge
    }
  }, {
    rootMargin: '200px' // Déclenche le chargement 200px AVANT que l'utilisateur ne touche le vrai fond (plus fluide !)
  })

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

// Quand l'utilisateur publie une annonce depuis la modale, on rafraîchit à zéro
const handleModalClose = () => {
  isCreateModalOpen.value = false
  fetchAnnonces(true) 
}

onMounted(() => {
  fetchAnnonces(true) // Premier chargement (page 1)
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect() // Nettoyage de la mémoire quand on quitte la page
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

          <div ref="loadMoreTrigger" class="w-full py-4 flex justify-center items-center">
            <div v-if="isLoadingMore" class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p v-else-if="!hasMore && annonces.length > 0" class="text-xs text-gray-400 font-medium py-2">
              Vous avez vu toutes les publications.
            </p>
          </div>
        </div>
      </main>
    </div>

    <CreatePostModal 
      :is-open="isCreateModalOpen" 
      @close="handleModalClose" 
    />
  </div>
</template>