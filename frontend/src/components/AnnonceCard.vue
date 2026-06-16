<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import AnnonceCommentaires from './AnnoncesCommentaires.vue' // Import du nouveau composant

// Interfaces restent intactes
interface Utilisateur { id: number; prenom: string; nom: string; photoProfil?: string; }
interface Annonce { 
  id: number; type: string; datePublication: string; nbJaime: number; 
  auteur: Utilisateur; nbCommentaires: number; titre?: string; texte?: string; 
  description?: string; annee?: string; sousType?: string; nbCandidatsVoulus?: number;
  likedByMe?: boolean;
}

const props = defineProps<{ annonce: Annonce; }>()
const authStore = useAuthStore()

// États locaux réactifs
const localNbJaime = ref(props.annonce.nbJaime)
const isLiked = ref(props.annonce.likedByMe || false)
const localNbCommentaires = ref(props.annonce.nbCommentaires)

const showCommentaires = ref(false)
const isLikeSubmitting = ref(false)

// Fonctions utilitaires
const getInitials = (prenom?: string, nom?: string) => `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

// Logique du Like / Dislike (Parfaitement imbriquée)
const toggleLike = async () => {
  if (isLikeSubmitting.value) return
  isLikeSubmitting.value = true

  // Sauvegarde de l'état initial pour le rollback
  const wasLiked = isLiked.value

  // UI Optimiste : Changement immédiat à l'écran
  if (isLiked.value) {
    localNbJaime.value--
    isLiked.value = false
  } else {
    localNbJaime.value++
    isLiked.value = true
  }

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/annonces/${props.annonce.id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
      }
    })

    if (!response.ok) {
      throw new Error('Erreur serveur lors du like')
    }
  } catch (error) {
    console.error('Erreur lors du like:', error)
    // Rollback automatique en cas d'erreur réseau ou HTTP
    isLiked.value = wasLiked
    localNbJaime.value = wasLiked ? props.annonce.nbJaime : props.annonce.nbJaime
  } finally {
    isLikeSubmitting.value = false
  }
}
</script>

<template>
  <article class="bg-white rounded-xl shadow-sm hover:shadow transition duration-200 overflow-hidden">
    <div class="p-5">
      <div class="flex justify-between items-start mb-4">
        <router-link :to="`/profil/${annonce.auteur.id}`" class="flex items-center gap-3 hover:opacity-75 transition">
          <div class="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-gray-600">
            {{ getInitials(annonce.auteur.prenom, annonce.auteur.nom) }}
          </div>
          <div>
            <h3 class="font-bold text-gray-900 leading-tight hover:text-blue-600 transition">
              {{ annonce.auteur.prenom }} {{ annonce.auteur.nom }}
            </h3>
            <p class="text-xs text-gray-500">{{ formatDate(annonce.datePublication) }}</p>
          </div>
        </router-link>
        <span class="text-xs font-bold px-3 py-1 rounded-full" :class="{
          'bg-green-100 text-green-700': annonce.type === 'AnnonceBonPlan',
          'bg-purple-100 text-purple-700': annonce.type === 'AnnonceTutorat',
          'bg-blue-100 text-blue-700': annonce.type === 'AnnonceProjet',
          'bg-orange-100 text-orange-700': annonce.type === 'AnnonceExercice'
        }">{{ annonce.type.replace('Annonce', '') }}</span>
      </div>

      <div class="mt-2">
        <h2 v-if="annonce.titre" class="text-lg font-bold text-gray-900 mb-1">{{ annonce.titre }}</h2>
        <p v-if="annonce.texte" class="text-gray-700 whitespace-pre-line mb-2">{{ annonce.texte }}</p>
        <p v-if="annonce.description" class="text-gray-700 whitespace-pre-line italic mb-2">{{ annonce.description }}</p>
        
        <div class="flex flex-wrap gap-2 mt-3">
          <span v-if="annonce.sousType" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Catégorie : {{ annonce.sousType }}</span>
          <span v-if="annonce.annee" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Année : {{ annonce.annee }}</span>
          <span v-if="annonce.nbCandidatsVoulus" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Cherche : {{ annonce.nbCandidatsVoulus }} personne(s)</span>
        </div>
      </div>
    </div> 

    <div class="bg-gray-50 px-5 py-3 border-t border-gray-100 flex gap-6 text-gray-500 font-medium text-sm">
      <button 
        @click="toggleLike"
        class="flex items-center gap-2 transition group"
        :class="isLiked ? 'text-red-500 font-bold' : 'hover:text-red-500'"
      >
        <span class="transition transform group-active:scale-125">{{ isLiked ? '❤️' : '🤍' }}</span> 
        {{ localNbJaime }}
      </button>

      <button 
        @click="showCommentaires = !showCommentaires"
        class="flex items-center gap-2 hover:text-blue-600 transition"
        :class="showCommentaires ? 'text-blue-600 font-bold' : ''"
      >
        <span>💬</span> {{ localNbCommentaires }}
      </button>
    </div>

    <AnnonceCommentaires 
      v-if="showCommentaires" 
      :annonce-id="annonce.id" 
      @comment-added="localNbCommentaires++" 
    />
  </article>
</template>