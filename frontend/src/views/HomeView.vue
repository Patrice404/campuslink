<script setup lang="ts">
import { ref, onMounted } from 'vue' // <-- N'oublie pas l'import de onMounted ici
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import AnnonceCard from '../components/AnnonceCard.vue'

// États du Feed
const annonces = ref<any[]>([]); 
const loading = ref(true);
const error = ref("");

// État du menu mobile
const isMobileMenuOpen = ref(false)

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
      
      <TopNav @open-menu="isMobileMenuOpen = true" />

      <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div class="max-w-2xl mx-auto space-y-6">
          
          <section class="bg-white rounded-xl shadow-sm p-4 flex gap-4 border border-gray-100">
            <div class="w-12 h-12 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center font-bold">
              Moi
            </div>
            <div class="flex-1">
              <input 
                type="text" 
                class="w-full bg-gray-50 rounded-full px-4 py-3 border-transparent hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 transition cursor-pointer outline-none" 
                placeholder="Publier une nouvelle annonce..."
                readonly
              >
            </div>
          </section>

          <div v-if="loading" class="text-center py-10 text-gray-500 animate-pulse">
            Chargement...
          </div>
          <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {{ error }}
          </div>

          <section v-else class="space-y-4">
            <AnnonceCard 
              v-for="item in annonces" 
              :key="item.id" 
              :annonce="item" 
            />
          </section>

        </div>
      </div>
    </main>
  </div>
</template>