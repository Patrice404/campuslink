<script setup lang="ts">
import { ref, onMounted, computed } from 'vue' // <-- N'oublie pas l'import de onMounted ici
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import CreatePostModal from '../components/CreatePostModal.vue' 
import AnnonceCard from '../components/AnnonceCard.vue'

// États du Feed
const annonces = ref<any[]>([]); 
const loading = ref(true);
const error = ref("");

// État du menu mobile
const isMobileMenuOpen = ref(false)
const isCreateModalOpen = ref(false) 

// Logique de recherche
const searchQuery = ref("");
const filteredAnnonces = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  
  // Si la barre de recherche est vide, on retourne toutes les annonces
  if (!query) return annonces.value;

  // Sinon, on filtre
  return annonces.value.filter(annonce => {
    // On rassemble tous les textes pertinents de l'annonce pour chercher partout d'un coup
    const searchableText = [
      annonce.titre,
      annonce.texte,
      annonce.description,
      annonce.type,
      annonce.sousType,
      annonce.auteur?.prenom,
      annonce.auteur?.nom
    ].filter(Boolean).join(" ").toLowerCase(); // On enlève les vides et on met en minuscules

    return searchableText.includes(query);
  });
});

onMounted(async () => {
  try {
    // Fausse simulation de chargement (A remplacer plus tard quand la bdd sera pret)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    annonces.value = [
      { id: 1, type: "AnnonceBonPlan", datePublication: "2026-06-15T14:30:00Z", nbJaime: 45, auteur: { prenom: "Léo", nom: "Martin" }, nbCommentaires: 12, titre: "Réduction Crous", texte: "Profitez de 50%..." },
      { id: 2, type: "AnnonceTutorat", datePublication: "2026-06-15T10:15:00Z", nbJaime: 12, auteur: { prenom: "Sarah", nom: "Lefevre" }, nbCommentaires: 3, description: "Cours d'algo...", annee: "L2" }
    ];
  } catch (err) {
    error.value = "Impossible de charger les annonces.";
  } finally {
    loading.value = false;
  }
});
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
                class="w-full bg-gray-50 rounded-lg pl-10 pr-4 py-3 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none" 
                placeholder="Rechercher par mots-clés, auteur, catégorie...">
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
              v-for="item in filteredAnnonces" 
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
    />
  </div>
</template>