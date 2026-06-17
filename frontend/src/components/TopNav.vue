<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
// ⚡️ AJOUT : Importations pour l'avatar et la navigation du profil
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

defineEmits(['open-menu', 'open-create-modal'])

// ⚡️ AJOUT : Initialisation du store et de l'URL API
const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const notifications = ref<any[]>([])
const isDropdownOpen = ref(false)

const hasUnread = computed(() => {
  return notifications.value.some(n => !n.lue)
})

// ⚡️ AJOUT : Calcul des initiales si pas de photo de profil
const initials = computed(() => {
  const user = authStore.user
  if (!user) return "?"
  return `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase()
})

const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem('token') 

    const response = await fetch(`${apiUrl}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      notifications.value = await response.json()
    }
  } catch (error) {
    console.error("Impossible de charger les notifications", error)
  }
}

const markAsRead = async (id: string) => {
  try {
    const token = localStorage.getItem('token')

    await fetch(`${apiUrl}/api/notifications/${id}/lue`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const target = notifications.value.find(n => n.id === id)
    if (target) target.lue = true
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchNotifications()
})
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

      <h1 class="text-xl font-bold text-gray-800">Actualité</h1>
    </div>

    <div class="flex items-center gap-3 md:gap-4">
      
      <div class="relative">
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
      </div>

      <button 
        @click="$emit('open-create-modal')"
        class="flex items-center gap-2 bg-secondary text-white px-3 md:px-4 py-2 rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm text-sm md:text-base"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span class="hidden md:inline">Nouveau Post</span> 
      </button>

      <RouterLink 
        to="/profil" 
        class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 transition shrink-0 cursor-pointer"
        title="Mon Profil"
      >
    
        <span >{{ initials }}</span>
      </RouterLink>

    </div>
  </header>
</template>