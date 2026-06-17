<script setup lang="ts">
<<<<<<< HEAD
import { ref, onMounted, computed } from 'vue'
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import CreatePostModal from '../components/CreatePostModal.vue'
import AnnonceCard from '../components/AnnonceCard.vue'   
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

// États de la vue
const isSidebarOpen = ref(false)
const isCreateModalOpen = ref(false)
const annoncesToutes = ref<any[]>([]) // Stocke toutes les annonces de l'API unifiée
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Filtrer uniquement les exercices côté Front-end tout en conservant les métadonnées (Likes, Commentaires)
const exercices = computed(() => {
  return annoncesToutes.value.filter((annonce: any) => {
    // Gère le cas où le type est déjà mappé ou sous format Enum Prisma d'origine
    return annonce.type === 'EXERCICE' || annonce.type === 'AnnonceExercice'
  }).map((item: any) => {
    return {
      ...item,
      // On garde 'AnnonceExercice' pour que AnnonceCard applique le style visuel adéquat
      type: 'AnnonceExercice',
      // On s'assure d'associer la structure de l'auteur requise
      auteur: item.utilisateur || item.auteur || { prenom: "Utilisateur", nom: "Inconnu", id: 0 },
      titre: item.titre || item.matiere?.titre || "Exercice d'entraide",
      texte: item.texte || item.description
    }
  })
})

// Récupération des données depuis la route globale unifiée et robuste
const fetchExercices = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    // Utilisation de la route synchronisée globale pour récupérer l'état exact des likes
    const response = await fetch(`${apiUrl}/api/annonces`, {
      method: 'GET',
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }

    const data = await response.json()
    annoncesToutes.value = data
  } catch (error) {
    console.error('Erreur entraide:', error)
    errorMessage.value = "Impossible de charger le fil d'entraide. Vérifie ta connexion."
  } finally {
    isLoading.value = false
  }
}

// Rafraîchir la liste après une publication réussie dans la modale
const handleModalClose = () => {
  isCreateModalOpen.value = false
  fetchExercices()
}

onMounted(() => {
  fetchExercices()
})
=======
import AnnonceFeedLayout from '../components/AnnonceFeedLayout.vue'
>>>>>>> f3a76efcf9f66a1808073d62118c151b1a9b381d
</script>

<template>
  <AnnonceFeedLayout 
    page-title="Espace Entraide & Devoirs"
    page-subtitle="Trouve de l'aide ou propose tes compétences sur les exercices bloquants."
    api-endpoint="entraide"
    card-type="AnnonceExercice"
    fallback-card-title="Exercice d'entraide"
    empty-state-emoji="🎉"
    empty-state-title="Aucun exercice en souffrance !"
    empty-state-subtitle="Tout le monde est à jour, ou c'est le moment idéal pour poser ta première question."
  />
</template>