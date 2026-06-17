<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router' 
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// On reçoit l'état d'ouverture depuis HomeView
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

// On déclare l'événement de fermeture
defineEmits(['close'])

const handleLogout = () => {
  console.log("Déconnexion")
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 bg-gray-900/50 z-20 md:hidden transition-opacity"
    @click="$emit('close')"
  ></div>

  <aside 
    :class="[
      'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 md:static md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    
    <div class="h-16 flex items-center justify-between px-6 border-b border-gray-100 mb-4">
      <span class="text-xl font-black text-gray-900 tracking-tight">
        Campus<span class="text-secondary">Link</span>
      </span>
      <button @click="$emit('close')" class="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav class="flex-1 px-4 space-y-1 overflow-y-auto">
      
      <RouterLink to="/home" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-secondary transition-colors">
        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        Accueil
      </RouterLink>

      <RouterLink to="/profil" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-secondary transition-colors">
        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        Mon Profil
      </RouterLink>

      <RouterLink to="/entraide" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-secondary transition-colors">
        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
        Entraide
      </RouterLink>

      <RouterLink to="/projets" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-secondary transition-colors">
        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
        </svg>
        Projets
      </RouterLink>

      <RouterLink to="/opportunites" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-secondary transition-colors">
        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
        Opportunités
      </RouterLink>

      <RouterLink to="/campus" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-secondary transition-colors">
        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
        Vie Campus
      </RouterLink>
    </nav>

    <div class="p-4 border-t border-gray-100">
      <button 
        @click="handleLogout" 
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
        </svg>
        Déconnexion
      </button>
    </div>

  </aside>
</template>