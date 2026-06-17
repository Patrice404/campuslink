<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import AnnonceCommentaires from './AnnoncesCommentaires.vue'

// Interfaces 
interface Utilisateur { id: number; prenom: string; nom: string; photoProfil?: string; }
interface Annonce { 
  id: number; type: string; datePublication: string; nbJaime: number; 
  auteur: Utilisateur; nbCommentaires: number; titre?: string; texte?: string; 
  description?: string; annee?: string; sousType?: string; nbCandidatsVoulus?: number;
  likedByMe?: boolean;
}

const props = defineProps<{ annonce: Annonce; }>()
const authStore = useAuthStore()

// États locaux réactifs (Sécurisés avec Number() pour contrer les décalages de types/BigInt)
const localNbJaime = ref(Number(props.annonce.nbJaime || 0))
const isLiked = ref(props.annonce.likedByMe || false)
const localNbCommentaires = ref(Number(props.annonce.nbCommentaires || 0))

const showCommentaires = ref(false)
const isLikeSubmitting = ref(false)

// Fonctions utilitaires
const getInitials = (prenom?: string, nom?: string) => `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
const formatDate = (dateString: string) => {
  if (!dateString) return "Date inconnue";
  return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

// Logique du Like / Dislike alignée sur le nouveau standard (:type/:id/like)
const toggleLike = async () => {
  if (isLikeSubmitting.value) return
  isLikeSubmitting.value = true

  // 1. Sauvegarde stricte de l'état d'origine avant toute action
  const wasLiked = isLiked.value
  const initialNbJaime = localNbJaime.value

  try {
    // 2. Mise à jour optimiste immédiate : l'interface change instantanément pour l'utilisateur
    isLiked.value = !wasLiked
    localNbJaime.value = !wasLiked ? initialNbJaime + 1 : Math.max(0, initialNbJaime - 1)

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    let typeRequete = props.annonce.type
    if (typeRequete === 'AnnonceExercice') typeRequete = 'EXERCICE'
    if (typeRequete === 'AnnonceBonPlan') typeRequete = 'BON_PLAN'
    if (typeRequete === 'AnnonceTutorat') typeRequete = 'TUTORAT'
    if (typeRequete === 'AnnonceProjet') typeRequete = 'PROJET'

    // Requête alignée sur ton nouveau système d'URL : /api/annonces/:type/:id/like
    const response = await fetch(`${apiUrl}/api/annonces/${typeRequete}/${props.annonce.id}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    /*if (response.ok) {
      const data = await response.json()
      
      // 3. Synchronisation finale et sécurisée avec la clé exacte du contrôleur backend : data.jaime
      if (data && typeof data.jaime === 'boolean') {
        isLiked.value = data.jaime
        // On recalcule à partir du compteur initial d'origine pour éviter les cumuls ou les glissements infinis
        localNbJaime.value = data.jaime ? initialNbJaime + (wasLiked ? 0 : 1) : Math.max(0, initialNbJaime - (wasLiked ? 1 : 0))
      }
    }*/
    if (response.ok) {
        const data = await response.json()
        
        // Correction ici : data.liked au lieu de data.jaime suite à votre refonte backend
        if (data && typeof data.liked === 'boolean') {
          isLiked.value = data.liked
          localNbJaime.value = data.liked ? initialNbJaime + (wasLiked ? 0 : 1) : Math.max(0, initialNbJaime - (wasLiked ? 1 : 0))
        }
      } else {
      // Annulation et retour à l'état d'origine si le backend refuse (ex: Token expiré)
      console.error(`Erreur serveur lors du like (Statut: ${response.status})`)
      isLiked.value = wasLiked
      localNbJaime.value = initialNbJaime
    }
  } catch (error) {
    console.error('Erreur réseau lors du like:', error)
    // Réversion en cas de coupure réseau
    isLiked.value = wasLiked
    localNbJaime.value = initialNbJaime
  } finally {
    isLikeSubmitting.value = false
  }
}
</script>

<template>
  <article class="bg-white rounded-xl shadow-sm hover:shadow transition duration-200 overflow-hidden">
    <div class="p-5">
      <div class="flex justify-between items-start mb-4">
        <router-link :to="`/profil/${annonce.auteur?.id}`" class="flex items-center gap-3 hover:opacity-75 transition" v-if="annonce.auteur">
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
        
        <div class="flex items-center gap-3" v-else>
          <div class="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <span class="text-xs font-bold px-3 py-1 rounded-full" :class="{
          'bg-green-100 text-green-700': annonce.type === 'AnnonceBonPlan' || annonce.type === 'BON_PLAN',
          'bg-purple-100 text-purple-700': annonce.type === 'AnnonceTutorat' || annonce.type === 'TUTORAT',
          'bg-blue-100 text-blue-700': annonce.type === 'AnnonceProjet' || annonce.type === 'PROJET',
          'bg-orange-100 text-orange-700': annonce.type === 'AnnonceExercice' || annonce.type === 'EXERCICE'
        }">
          {{ annonce.type.replace('Annonce', '') }}
        </span>
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
      :annonceType="annonce.type" 
      @comment-added="localNbCommentaires++"
    />
  </article>
</template>