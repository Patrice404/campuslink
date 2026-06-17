<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

// Flux complet
const fetchAnnonces = () => charger(`${apiUrl}/api/annonces`);

// Recherche à tags : appelée par SmartSearch
const runSearch = (params: Record<string, string>) => {
  const keys = Object.keys(params);
  isRecherche.value = keys.length > 0;
  if (keys.length === 0) {
    fetchAnnonces();
    return;
  }
  const qs = new URLSearchParams(params).toString();
  charger(`${apiUrl}/api/annonces/recherche?${qs}`);
};

// On charge au démarrage initial de la page
onMounted(fetchAnnonces);
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
          
          <section class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <SmartSearch @search="runSearch" />
          </section>

          <div v-if="loading" class="text-center py-10 text-gray-500 animate-pulse">
            Chargement des annonces...
          </div>
          <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {{ error }}
          </div>

          <section v-else class="space-y-4">
            
            <div v-if="annonces.length === 0" class="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
              <p class="text-lg">😕 {{ isRecherche ? 'Aucune annonce ne correspond à ta recherche.' : 'Aucune annonce pour le moment.' }}</p>
            </div>

            <AnnonceCard
              v-for="item in annonces"
              :key="item.id"
              :annonce="item"
            />
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