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
  loading.value = true;
  error.value = "";

  try {
    // 1. Récupération de l'URL de base et du token de connexion
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const token = localStorage.getItem("token");

    // 2. Appel à l'API (On suppose que ta route est /api/annonces)
    const response = await fetch(`${apiUrl}/api/annonces`, {
      method: 'GET',
      headers: {
        // On envoie le token pour prouver que l'utilisateur est connecté
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept': 'application/json'
      }
    });

    // 3. Gestion des erreurs HTTP (ex: 401 Non autorisé, 500 Erreur serveur)
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }

    // 4. On injecte les vraies données dans notre variable réactive
    const rawData = await response.json();
    annonces.value = rawData.map((annonce: any) => {
      
      // 1. Traduire les ENUMS Prisma pour que les couleurs de tes badges fonctionnent
      let typeVisuel = annonce.type;
      if (annonce.type === 'BON_PLAN') typeVisuel = 'AnnonceBonPlan';
      if (annonce.type === 'TUTORAT') typeVisuel = 'AnnonceTutorat';
      if (annonce.type === 'PROJET') typeVisuel = 'AnnonceProjet';
      if (annonce.type === 'EXERCICE') typeVisuel = 'AnnonceExercice';

      return {
        ...annonce,
        type: typeVisuel, // Remplace 'BON_PLAN' par 'AnnonceBonPlan'
        // 2. Prisma utilise "utilisateur", mais AnnonceCard s'attend à "auteur"
        auteur: annonce.utilisateur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 }
      };
    });

  } catch (err) {
    console.error("Détail de l'erreur API :", err);
    error.value = "Impossible de charger les annonces depuis le serveur.";
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