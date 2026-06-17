<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import CreatePostModal from '../components/CreatePostModal.vue'
import AnnonceCard from '../components/AnnonceCard.vue'
import SmartSearch from '../components/SmartSearch.vue'
import { useAuthStore } from '../stores/authStore'
const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const annonces = ref<any[]>([]);
const loading = ref(true);
const error = ref("");
const isRecherche = ref(false);

const isMobileMenuOpen = ref(false)
const isCreateModalOpen = ref(false)

<<<<<<< HEAD
// --- DÉBUT INTEGRATION SYSTÈME NOTIFICATIONS ---
const notifications = ref<any[]>([])
const showNotifDropdown = ref(false)

// Propriété calculée pour le compteur de badges rouges (uniquement les alertes lues = false)
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.lue).length
})

// Récupération des notifications depuis l'API globale
const fetchNotifications = async () => {
  if (!authStore.token) return
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
    const response = await fetch(`${apiUrl}/api/notifications`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })
    if (response.ok) {
      notifications.value = await response.json()
    }
  } catch (err) {
    console.error("Impossible de charger les notifications:", err)
  }
}

// Ouvre/ferme la cloche et force la récupération des dernières notifications en BDD
const toggleNotifDropdown = () => {
  showNotifDropdown.value = !showNotifDropdown.value
  if (showNotifDropdown.value) {
    fetchNotifications()
  }
}

// Marquer une alerte comme lue lors du clic
const markAsRead = async (notifId: string) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
    const response = await fetch(`${apiUrl}/api/notifications/${notifId}/lire`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    if (response.ok) {
      // Mutation de l'état local optimiste pour mettre à jour l'UI instantanément
      const notif = notifications.value.find(n => n.id === notifId)
      if (notif) notif.lue = true
    }
  } catch (err) {
    console.error("Erreur lors du traitement de la notification:", err)
  }
}
// --- FIN INTEGRATION SYSTÈME NOTIFICATIONS ---

const searchQuery = ref("");
const filteredAnnonces = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return annonces.value;
=======
// Pagination : affichage progressif par lots de 5
const visibleCount = ref(5);
const displayedAnnonces = computed(() => annonces.value.slice(0, visibleCount.value));
const loadMore = () => { visibleCount.value += 5; };
>>>>>>> 160b20de483442cbda3430caff66a932825dc89e

// Normalise une annonce de l'API pour l'affichage (type visuel + auteur)
const mapAnnonce = (a: any) => {
  const map: Record<string, string> = {
    BON_PLAN: 'AnnonceBonPlan', TUTORAT: 'AnnonceTutorat',
    PROJET: 'AnnonceProjet', EXERCICE: 'AnnonceExercice',
  };
  return {
    ...a,
    type: map[a.type] || a.type,
    auteur: a.utilisateur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 },
  };
};

const headers = () => ({
  ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
  Accept: 'application/json',
});

const charger = async (url: string) => {
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch(url, { headers: headers() });
    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
    const rawData = await response.json();
    annonces.value = rawData.map(mapAnnonce);
  } catch (err) {
    console.error("Détail de l'erreur API :", err);
    error.value = "Impossible de charger les annonces depuis le serveur.";
  } finally {
    loading.value = false;
  }
};

<<<<<<< HEAD
// Modification du hook de montage pour charger à la fois le fil et les notifications au départ
onMounted(() => {
  fetchAnnonces();
  fetchNotifications();
});
=======
// Flux complet
const fetchAnnonces = () => charger(`${apiUrl}/api/annonces`);

// Recherche à tags : appelée par SmartSearch
const runSearch = (params: Record<string, string>) => {
  const keys = Object.keys(params);
  isRecherche.value = keys.length > 0;
  visibleCount.value = 5; // on réinitialise la pagination à chaque recherche
  if (keys.length === 0) {
    fetchAnnonces();
    return;
  }
  const qs = new URLSearchParams(params).toString();
  charger(`${apiUrl}/api/annonces/recherche?${qs}`);
};

// On charge au démarrage initial de la page
onMounted(fetchAnnonces);
>>>>>>> 160b20de483442cbda3430caff66a932825dc89e
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">

    <SidebarNav
      :is-open="isMobileMenuOpen"
      @close="isMobileMenuOpen = false"
    />

    <main class="flex-1 flex flex-col min-w-0">

      <TopNav
        @open-menu="isMobileMenuOpen = true"
        @open-create-modal="isCreateModalOpen = true"
      />

      <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div class="max-w-2xl mx-auto space-y-6">
<<<<<<< HEAD
          
          <section class="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3">
            <div class="relative flex-1">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                </svg>
              </div>
              <input 
                v-model="searchQuery"
                type="search" 
                class="w-full bg-gray-50 rounded-lg pl-10 pr-4 py-3 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none" 
                placeholder="Rechercher par mots-clés, auteur, catégorie...">
            </div>

            <div class="relative shrink-0">
              <button 
                @click="toggleNotifDropdown" 
                class="relative p-3 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-50 border border-slate-200/60 transition duration-150 cursor-pointer"
                title="Notifications"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span 
                  v-if="unreadCount > 0" 
                  class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white"
                >
                  {{ unreadCount }}
                </span>
              </button>

              <div 
                v-if="showNotifDropdown" 
                class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 max-h-80 overflow-y-auto"
              >
                <div class="px-4 py-2 font-bold text-sm text-slate-800 border-b border-slate-100 flex justify-between items-center">
                  <span>Centre d'alertes</span>
                  <span class="text-xs text-indigo-600 font-medium">{{ unreadCount }} non lue(s)</span>
                </div>
                
                <div v-if="notifications.length === 0" class="px-4 py-6 text-center text-xs text-slate-400">
                  Aucune notification pour le moment.
                </div>
                
                <div v-else class="divide-y divide-slate-50">
                  <div 
                    v-for="notif in notifications" 
                    :key="notif.id" 
                    @click="markAsRead(notif.id)"
                    class="p-3 text-xs transition cursor-pointer hover:bg-slate-50 flex items-start gap-2"
                    :class="{ 'bg-indigo-50/40 font-semibold text-slate-900': !notif.lue, 'text-slate-500': notif.lue }"
                  >
                    <div class="flex-1">
                      <p class="leading-normal">{{ notif.contenu }}</p>
                      <span class="text-[9px] text-slate-400 font-normal">Récemment</span>
                    </div>
                    <span v-if="!notif.lue" class="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></span>
                  </div>
                </div>
              </div>
            </div>
=======

          <section class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <SmartSearch @search="runSearch" />
>>>>>>> 160b20de483442cbda3430caff66a932825dc89e
          </section>

          <div v-if="loading" class="text-center py-10 text-gray-500 animate-pulse">
            Chargement des annonces...
          </div>
          <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {{ error }}
          </div>

          <section v-else class="space-y-4">

            <div v-if="annonces.length === 0" class="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
              <p class="text-lg"> {{ isRecherche ? 'Aucune annonce ne correspond à ta recherche.' : 'Aucune annonce pour le moment.' }}</p>
            </div>

            <AnnonceCard
              v-for="item in displayedAnnonces"
              :key="item.id"
              :annonce="item"
            />

            <div v-if="visibleCount < annonces.length" class="text-center pt-4">
              <button
                @click="loadMore"
                class="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-indigo-50 text-indigo-600 border border-gray-200 hover:border-indigo-300 font-bold text-sm rounded-xl transition shadow-sm cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Afficher plus de publications
              </button>
            </div>

          </section>

        </div>
      </div>
    </main>

    <CreatePostModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @post-created="fetchAnnonces"
    />
  </div>
</template>
