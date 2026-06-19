<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const blockedUsers = ref<any[]>([])
const loading = ref(true)
const error = ref("")
const successMessage = ref("")

const isMobileMenuOpen = ref(false)

// ✨ ÉTATS POUR LE MODAL DE DÉBLOCAGE SUR MESURE
const showUnblockConfirm = ref(false)
const userToUnblock = ref<any | null>(null)

// Charger la liste des personnes bloquées
const fetchBlockedUsers = async () => {
  loading.value = true
  error.value = ""
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${apiUrl}/api/settings/blocked`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) throw new Error("Impossible de récupérer la liste.");
    blockedUsers.value = await response.json()
  } catch (err) {
    error.value = "Erreur lors du chargement des utilisateurs bloqués."
  } finally {
    loading.value = false
  }
}

/**
 * ✨ Étape 1 : Intercepte le clic sur le bouton "Débloquer"
 * Enregistre l'utilisateur sélectionné et ouvre la modale
 */
const triggerUnblockConfirmation = (user: any) => {
  userToUnblock.value = user
  showUnblockConfirm.value = true
}

/**
 * ✨ Étape 2 : Exécute l'action de déblocage après confirmation dans le modal
 */
const executeUnblock = async () => {
  if (!userToUnblock.value) return;
  
  const userId = userToUnblock.value.id;
  showUnblockConfirm.value = false; // Ferme le modal immédiatement
  
  error.value = ""
  successMessage.value = ""
  
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${apiUrl}/api/settings/blocked/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) throw new Error("Échec du déblocage.");
    
    // Message éphémère de succès et rafraîchissement local
    successMessage.value = "Utilisateur débloqué !"
    setTimeout(() => successMessage.value = "", 3000)
    
    // Retirer directement l'élément de la liste réactive
    blockedUsers.value = blockedUsers.value.filter(user => user.id !== userId)
  } catch (err) {
    error.value = "Impossible de débloquer cet utilisateur."
  } finally {
    userToUnblock.value = null // Nettoie l'état local
  }
}

onMounted(fetchBlockedUsers)
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <SidebarNav :is-open="isMobileMenuOpen" @close="isMobileMenuOpen = false" />

    <main class="flex-1 flex flex-col min-w-0">
      <TopNav @open-menu="isMobileMenuOpen = true" />

      <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div class="max-w-3xl mx-auto space-y-6">
          
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Paramètres de ton compte</h1>
            <p class="text-sm text-gray-500">Gère tes préférences, la confidentialité et la modération de ton profil.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            <nav class="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
              <button class="w-full text-left px-3 py-2 text-sm font-bold bg-white text-indigo-600 rounded-lg shadow-sm border border-gray-100 whitespace-nowrap">
                Utilisateurs bloqués
              </button>
            </nav>

            <div class="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4">
              <div>
                <h2 class="text-lg font-bold text-gray-900">Gestion de la liste noire</h2>
                <p class="text-xs text-gray-500">Les personnes listées ci-dessous ne peuvent plus voir tes publications et leurs contenus te sont totalement masqués sur tous tes flux.</p>
              </div>

              <div v-if="successMessage" class="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium animate-fade-in">
                ✓ {{ successMessage }}
              </div>
              <div v-if="error" class="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                 {{ error }}
              </div>

              <div v-if="loading" class="text-center py-6 text-gray-400 animate-pulse text-sm">
                Chargement de la liste...
              </div>

              <div class="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl text-gray-400" v-else-if="blockedUsers.length === 0">
                <span class="text-2xl">🕊️</span>
                <p class="text-sm mt-1 font-medium">Ta liste d'utilisateurs bloqués est vide.</p>
              </div>

              <div class="divide-y divide-gray-100" v-else>
                <div 
                  v-for="user in blockedUsers" 
                  :key="user.id" 
                  class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div class="flex items-center gap-3">
                    <img 
                      :src="user.photoProfil || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'" 
                      class="w-10 h-10 rounded-full object-cover border border-gray-100" 
                      alt="Avatar"
                    />
                    <div>
                      <h4 class="text-sm font-bold text-gray-900">{{ user.prenom }} {{ user.nom }}</h4>
                      <span class="inline-block text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {{ user.role }}
                      </span>
                    </div>
                  </div>

                  <button 
                    @click="triggerUnblockConfirmation(user)"
                    class="px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Débloquer
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>

    <div v-if="showUnblockConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showUnblockConfirm = false"></div>
      
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-150">
        <h3 class="text-base font-bold text-slate-900 mb-1">
          Débloquer l'utilisateur ?
        </h3>
        <p class="text-slate-500 text-sm mb-6 leading-relaxed">
          Voulez-vous vraiment débloquer <span class="font-semibold text-slate-800">{{ userToUnblock?.prenom }} {{ userToUnblock?.nom }}</span> ? Cet utilisateur pourra à nouveau voir tes publications et interagir avec toi.
        </p>
        
        <div class="flex gap-3 justify-end">
          <button 
            @click="showUnblockConfirm = false" 
            class="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition cursor-pointer"
          >
            Annuler
          </button>
          <button 
            @click="executeUnblock" 
            class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 rounded-xl transition cursor-pointer"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>

  </div>
</template>