<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// On déclare l'événement pour ouvrir le menu mobile
defineEmits(['open-menu'])

// --- Logique des Notifications ---

// Variable réactive pour stocker le tableau de notifications reçues du backend
const notifications = ref<any[]>([])

// Variable pour ouvrir/fermer la cloche (menu déroulant)
const isDropdownOpen = ref(false)

// Propriété calculée (Computed) pour savoir s'il y a au moins une notif non lue
const hasUnread = computed(() => {
  return notifications.value.some(n => !n.lue)
})

// Fonction qui va appeler l'API Express
const fetchNotifications = async () => {
  try {
    // On récupère le token d'authentification stocké lors du login (souvent dans le localStorage)
    const token = localStorage.getItem('token') 
    
    // URL de ton backend (défini dans ton frontend/.env)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    const response = await fetch(`${apiUrl}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // On envoie le token pour que le middleware 'auth' du backend nous accepte
        'Authorization': `Bearer ${token}` 
      }
    })

    if (response.ok) {
      notifications.value = await response.json()
    } else {
      console.error("Erreur API:", response.statusText)
    }
  } catch (error) {
    console.error("Impossible de charger les notifications", error)
  }
}

// Fonction pour marquer une notification comme lue au clic
const markAsRead = async (id: string) => {
  try {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    // Appel à ta route put('/:id/lue')
    await fetch(`${apiUrl}/api/notifications/${id}/lue`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    // On met à jour graphiquement notre tableau local sans refaire d'appel API
    const target = notifications.value.find(n => n.id === id)
    if (target) target.lue = true

  } catch (error) {
    console.error(error)
  }
}

// Dès que le composant est chargé à l'écran, on va chercher les données
onMounted(() => {
  fetchNotifications()
})

const createPost = () => {
  console.log("Ouvrir la modale de nouveau post")
}
</script>

<template>
  <header class="h-16 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
    
    <div class="flex items-center gap-3 flex-1">
      <button 
        @click="$emit('open-menu')" 
        class="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <h1 class="text-xl font-bold text-gray-800">Fil d'actualité</h1>
    </div>

    <div class="flex items-center gap-3 md:gap-4 relative">
      
      <button 
        @click="isDropdownOpen = !isDropdownOpen"
        class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        
        <span v-if="hasUnread" class="absolute top-1.5 right-1.5 block w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
      </button>

      <div v-if="isDropdownOpen" class="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
        <h3 class="px-4 py-2 font-bold text-gray-700 border-b border-gray-100 text-sm">Notifications</h3>
        
        <div class="max-h-64 overflow-y-auto">
          <p v-if="notifications.length === 0" class="text-xs text-gray-400 text-center py-6">Aucune notification pour le moment</p>
          
          <div 
            v-for="notif in notifications" 
            :key="notif.id" 
            @click="markAsRead(notif.id)"
            class="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-sm text-gray-600 cursor-pointer"
            :class="{'bg-blue-50/60 font-semibold text-gray-900': !notif.lue}"
          >
            <p>{{ notif.contenu }}</p>
            <span class="text-xs text-gray-400 block mt-1">
              {{ new Date(notif.dateCreation).toLocaleDateString() }}
            </span>
          </div>
        </div>
      </div>

     <!-- Bouton Nouveau Post -->
      <button 
        @click="createPost"
        class="flex items-center gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm text-sm md:text-base"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span class="hidden md:inline">Nouveau Post</span>
      </button>
    </div>
  </header>
</template>