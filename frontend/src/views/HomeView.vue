<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import CreatePostModal from '../components/CreatePostModal.vue'
import AnnonceCard from '../components/AnnonceCard.vue'
import SmartSearch from '../components/SmartSearch.vue'
import { useAuthStore } from '../stores/authStore'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL

const annonces = ref<any[]>([]);
const loading = ref(true);
const error = ref("");
const isRecherche = ref(false);
const visibleCount = ref(10); 

const isMobileMenuOpen = ref(false)
const isCreateModalOpen = ref(false)


// ⚡️ AJOUT : État pour stocker l'annonce en cours de modification
const annonceToEdit = ref<any | null>(null);

/**
 * ⚡️ AJOUT : Ouvre la modale en mode édition avec l'annonce sélectionnée
 */
const handleEditAnnonce = (annonce: any) => {
  annonceToEdit.value = annonce;
  isCreateModalOpen.value = true;
};

/**
 * ⚡️ AJOUT : Ferme la modale et réinitialise l'état d'édition pour la prochaine fois
 */
const handleModalClose = () => {
  isCreateModalOpen.value = false;
  annonceToEdit.value = null;
};

const searchQuery = ref("");
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

const displayedAnnonces = computed(() => {
  return filteredAnnonces.value.slice(0, visibleCount.value);
});

const loadMore = () => {
  visibleCount.value += 10;
};

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
    visibleCount.value = 10; 
  } catch (err) {
    console.error("Détail de l'erreur API :", err);
    error.value = "Impossible de charger les annonces depuis le serveur.";
  } finally {
    loading.value = false;
  }
};

const fetchAnnonces = async () => {
  isRecherche.value = false;
  await charger(`${apiUrl}/api/annonces`);
};

// Affiche une seule annonce (clic depuis une notification), comme un résultat de recherche
const chargerAnnonceUnique = async (id: string, type?: string) => {
  loading.value = true;
  error.value = "";
  isRecherche.value = true;
  try {
    const url = `${apiUrl}/api/annonces/${id}` + (type ? `?type=${type}` : '');
    const response = await fetch(url, { headers: headers() });
    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
    const data = await response.json();
    annonces.value = data ? [mapAnnonce(data)] : [];
  } catch (err) {
    console.error("Détail de l'erreur API :", err);
    error.value = "Impossible de charger cette publication.";
  } finally {
    loading.value = false;
  }
};

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

// Si on arrive avec ?annonceId=...&type=... (clic notif), on affiche cette annonce ; sinon le fil
const chargerSelonRoute = () => {
  const aId = route.query.annonceId as string | undefined;
  if (aId) {
    chargerAnnonceUnique(aId, route.query.type as string | undefined);
  } else {
    fetchAnnonces();
  }
};

onMounted(() => {
   //On verifie si l'utilisateur est connecté avant de tenter de charger le profil
  if (!authStore.token) {
    router.push('/');
    return;
  }
  chargerSelonRoute();
});

// Re-déclenche si on clique une notif alors qu'on est déjà sur la page d'accueil
watch(() => route.query.annonceId, () => chargerSelonRoute());
</script>

<template>
  <div class="flex h-screen w-screen bg-gray-50 overflow-hidden">

    <SidebarNav
      :is-open="isMobileMenuOpen"
      @close="isMobileMenuOpen = false"
    />

    <main class="flex-1 flex flex-col min-w-0 h-full">

      <TopNav
        @open-menu="isMobileMenuOpen = true"
        @open-create-modal="isCreateModalOpen = true"
      />

      <div class="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
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

            <div v-if="filteredAnnonces.length === 0" class="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
              <p class="text-lg"> {{ isRecherche ? 'Aucune annonce ne correspond à ta recherche.' : 'Aucune annonce pour le moment.' }}</p>
            </div>

            <AnnonceCard
              v-for="item in displayedAnnonces"
              :key="item.id"
              :annonce="item"
              @edit="handleEditAnnonce"
              @deleted="fetchAnnonces"
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
      :annonce-to-edit="annonceToEdit"
      @close="handleModalClose"
      @post-created="fetchAnnonces"
    />
  </div>
</template>