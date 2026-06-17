<script setup lang="ts">
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue'
import SidebarNav from './SidebarNav.vue'
import TopNav from './TopNav.vue'
import CreatePostModal from './CreatePostModal.vue'
import AnnonceCard from './AnnonceCard.vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const MAX_ANNONCES_PER_PAGE = 4 // Ta limite de test

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

const isSidebarOpen = ref(false)
const isCreateModalOpen = ref(false)
const annonces = ref<any[]>([])


const page = ref(1)
const hasMore = ref(true)
const isLoading = ref(true)       
const isLoadingMore = ref(false)   
const errorMessage = ref<string | null>(null)

const annonceToEdit = ref<any | null>(null)
/*
* Gère l'événement d'édition d'une annonce.
* Ouvre le modal de création avec les données de l'annonce à éditer.
*/
const handleEditAnnonce = (annonce: any) => {
  annonceToEdit.value = annonce
  isCreateModalOpen.value = true
}




// ÉTAPE 1 : Références vers le conteneur de scroll ET le déclencheur bas de page
const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer')
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
    
    const nouvellesAnnonces = data.map((item: any) => ({
      ...item,
      type: props.cardType,
      auteur: item.utilisateur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 },
      titre: item.titre || item.matiere?.titre || props.fallbackCardTitle,
      texte: item.texte || item.description
    }))

    if (isRefresh) {
      annonces.value = nouvellesAnnonces 
    } else {
      annonces.value.push(...nouvellesAnnonces) 
    }

    // CORRECTION : Si on reçoit moins que la limite demandée, c'est la fin !
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

const setupIntersectionObserver = () => {
  if (observer) observer.disconnect()

  observer = new IntersectionObserver(async (entries) => {
    const trigger = entries[0]
    
    if (trigger.isIntersecting && hasMore.value && !isLoading.value && !isLoadingMore.value) {
      page.value++ 
      await fetchAnnonces() 
    }
  }, {
    // ÉTAPE 2 : On dit à l'observer de surveiller le scroll du <main> et non de la page entière
    root: scrollContainer.value, 
    rootMargin: '100px' 
  })

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}


const handleModalClose = async () => {
  isCreateModalOpen.value = false
  annonceToEdit.value = null 
  await fetchAnnonces(true)
  setupIntersectionObserver()
}


// ÉTAPE 3 : L'ordre d'exécution synchrone/asynchrone est corrigé ici
onMounted(async () => {
  await fetchAnnonces(true)     // 1. On attend la fin complète du premier chargement
  setupIntersectionObserver()  // 2. On active l'observer seulement quand les cartes sont là
})

onUnmounted(() => {
  if (observer) observer.disconnect()
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

      <main ref="scrollContainer" class="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl w-full mx-auto">
        
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
            @deleted="fetchAnnonces(true)"
            @edit="handleEditAnnonce"
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
      :annonce-to-edit="annonceToEdit"
      @close="handleModalClose" 
    />
  </div>
</template>