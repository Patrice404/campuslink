<script setup lang="ts">
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue'
import SidebarNav from './SidebarNav.vue'
import TopNav from './TopNav.vue'
import CreatePostModal from './CreatePostModal.vue'
import AnnonceCard from './AnnonceCard.vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const MAX_ANNONCES_PER_PAGE = 4 // Ta limite de pagination

const props = defineProps({
  pageTitle: { type: String, required: true },
  pageSubtitle: { type: String, required: true },
  apiEndpoint: { type: String, required: true }, // Ex: 'entraide', 'projets'
  cardType: { type: String, required: true },    // Ex: 'AnnonceExercice'
  fallbackCardTitle: { type: String, default: 'Publication' },
  emptyStateEmoji: { type: String, default: '🎉' },
  emptyStateTitle: { type: String, default: 'Aucune publication !' },
  emptyStateSubtitle: { type: String, default: 'Le fil est vide pour le moment.' }
})

const isSidebarOpen = ref(false)
const isCreateModalOpen = ref(false)
const annonces = ref<any[]>([])

// Pagination et États de chargement
const page = ref(1)
const hasMore = ref(true)
const isLoading = ref(true)       
const isLoadingMore = ref(false)   
const errorMessage = ref<string | null>(null)
const annonceToEdit = ref<any | null>(null)

// Flag pour bloquer l'IntersectionObserver pendant qu'on vide la liste (Refresh)
const isRefreshingNow = ref(false)

const handleEditAnnonce = (annonce: any) => {
  annonceToEdit.value = annonce
  isCreateModalOpen.value = true
}

// Références pour le scroll infini
const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer')
const loadMoreTrigger = useTemplateRef<HTMLElement>('loadMoreTrigger')
let observer: IntersectionObserver | null = null

const fetchAnnonces = async (isRefresh = false) => {
  if (isRefresh) {
    isRefreshingNow.value = true // Bloque temporairement l'observer
    page.value = 1
    hasMore.value = true
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  errorMessage.value = null
  
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const token = authStore.token || localStorage.getItem('token')

    // Configuration propre des en-têtes
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const separator = props.apiEndpoint.includes('?') ? '&' : '?'
    const urlComplete = `${apiUrl}/api/${props.apiEndpoint}${separator}page=${page.value}`

    const response = await fetch(urlComplete, {
      method: 'GET',
      headers: headers
    })
    
    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`)

    const data = await response.json()
    const structureData = Array.isArray(data) ? data : (data.results || data.data || [])

    // Mapping ultra-simple car le backend fait le gros du travail !
    const nouvellesAnnonces = structureData.map((item: any) => ({
      ...item,
      type: props.cardType,
      auteur: item.utilisateur || item.auteur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 },
      titre: item.titre || item.matiere?.titre || props.fallbackCardTitle,
      texte: item.texte || item.description,
      // On lie directement ce que le serveur a calculé
      isLikedByMe: item.isLikedByMe ?? false, 
      likesCount: item.nbJaime ?? 0
    }))

    if (isRefresh) {
      annonces.value = nouvellesAnnonces 
    } else {
      // Sécurité anti-doublon d'IDs lors du scroll rapide
      const existingIds = new Set(annonces.value.map(a => a.id))
      const filtree = nouvellesAnnonces.filter((a: any) => !existingIds.has(a.id))
      annonces.value.push(...filtree) 
    }

    // S'il y a moins de résultats que la limite, c'est la fin du fil
    if (structureData.length < MAX_ANNONCES_PER_PAGE) {
      hasMore.value = false
    }

  } catch (error) {
    console.error(`Erreur lors du chargement de ${props.apiEndpoint}:`, error)
    errorMessage.value = "Impossible de charger les données."
  } {
    isLoading.value = false
    isLoadingMore.value = false
    // On réactive l'observer une fois que le DOM s'est repositionné
    setTimeout(() => {
      isRefreshingNow.value = false
    }, 100)
  }
}

const setupIntersectionObserver = () => {
  if (observer) observer.disconnect()

  observer = new IntersectionObserver(async (entries) => {
    const trigger = entries[0]
    
    // Si on est en train de Reset/Refresh, on ignore le déclenchement intempestif
    if (isRefreshingNow.value) return

    if (trigger.isIntersecting && hasMore.value && !isLoading.value && !isLoadingMore.value) {
      page.value++ 
      await fetchAnnonces() 
    }
  }, {
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

onMounted(async () => {
  await fetchAnnonces(true)     
  setupIntersectionObserver()  
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