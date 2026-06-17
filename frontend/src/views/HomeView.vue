<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue' 
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import CreatePostModal from '../components/CreatePostModal.vue' 
import AnnonceCard from '../components/AnnonceCard.vue'
import { useAuthStore } from '../stores/authStore'
const authStore = useAuthStore()

const annonces = ref<any[]>([]); 
const loading = ref(true);
const error = ref("");

const isMobileMenuOpen = ref(false)
const isCreateModalOpen = ref(false) 

// Logique de recherche
const searchQuery = ref("");

// ✨ NOUVEAU : Limite initiale d'affichage (charge progressive)
const visibleCount = ref(5);

const filteredAnnonces = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return annonces.value;

  return annonces.value.filter(annonce => {
    const searchableText = [
      annonce.titre,
      annonce.texte,
      annonce.description,
      annonce.type,
      annonce.sousType,
      annonce.auteur?.prenom,
      annonce.auteur?.nom
    ].filter(Boolean).join(" ").toLowerCase();

    return searchableText.includes(query);
  });
});

// ✨ NOUVEAU : Tronquer la liste pour n'afficher que ce qui est chargé
const displayedAnnonces = computed(() => {
  return filteredAnnonces.value.slice(0, visibleCount.value);
});

// ✨ NOUVEAU : Charger le lot suivant (5 de plus)
const loadMore = () => {
  visibleCount.value += 5;
};

// Réinitialiser la pagination si une nouvelle recherche est tapée
watch(searchQuery, () => {
  visibleCount.value = 5;
});

const fetchAnnonces = async () => {
  loading.value = true;
  error.value = "";

  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const token = authStore.token;

    const response = await fetch(`${apiUrl}/api/annonces`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

    const rawData = await response.json();
    annonces.value = rawData.map((annonce: any) => {
      let typeVisuel = annonce.type;
      if (annonce.type === 'BON_PLAN') typeVisuel = 'AnnonceBonPlan';
      if (annonce.type === 'TUTORAT') typeVisuel = 'AnnonceTutorat';
      if (annonce.type === 'PROJET') typeVisuel = 'AnnonceProjet';
      if (annonce.type === 'EXERCICE') typeVisuel = 'AnnonceExercice';

      return {
        ...annonce,
        type: typeVisuel, 
        auteur: annonce.utilisateur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 }
      };
    });

  } catch (err) {
    console.error("Détail de l'erreur API :", err);
    error.value = "Impossible de charger les annonces depuis le serveur.";
  } finally {
    loading.value = false;
  }
};

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
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                </svg>
              </div>
              <input 
                v-model="searchQuery"
                type="search" 
                class="w-full bg-gray-50 rounded-lg pl-10 pr-4 py-3 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none" 
                placeholder="Rechercher sur tout le fil d'actualité...">
            </div>
          </section>

          <div v-if="loading" class="text-center py-10 text-gray-500 animate-pulse">
            Chargement des annonces...
          </div>
          <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {{ error }}
          </div>

          <section v-else class="space-y-4">
            
            <div v-if="filteredAnnonces.length === 0" class="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
              <p class="text-lg">😕 Aucune annonce trouvée pour "<strong>{{ searchQuery }}</strong>"</p>
            </div>

            <AnnonceCard 
              v-for="item in displayedAnnonces" 
              :key="item.id" 
              :annonce="item" 
            />

            <div v-if="visibleCount < filteredAnnonces.length" class="text-center pt-4">
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