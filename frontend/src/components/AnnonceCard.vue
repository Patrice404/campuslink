<script setup lang="ts">
<<<<<<< HEAD
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
=======
import { computed } from 'vue';

const props = defineProps<{
  annonce: any
}>();
>>>>>>> 859b4f0f4e717efda43a0924a382bf5db5032b28

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

<<<<<<< HEAD
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
=======
// Formater la date proprement
const dateAffichee = computed(() => {
  if (!props.annonce.datePublication) return "Récemment";
  return new Date(props.annonce.datePublication).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Générer les initiales de l'auteur en cas d'absence d'avatar
const initials = computed(() => {
  const auteur = props.annonce.auteur;
  if (!auteur) return "?";
  return `${auteur.prenom?.[0] || ""}${auteur.nom?.[0] || ""}`.toUpperCase();
});
</script>

<template>
  <article class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition duration-200">
    
    <div class="p-5 pb-3 flex items-center justify-between">
      
      <router-link 
        v-if="annonce.auteur?.id" 
        :to="'/profil/' + annonce.auteur.id" 
        class="flex items-center gap-3 group/author cursor-pointer"
      >
        <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-sm group-hover/author:border-indigo-400 transition duration-150">
          <img v-if="annonce.auteur?.photoProfil" :src="`${apiUrl}/uploads/${annonce.auteur.photoProfil}`" alt="Avatar" class="w-full h-full object-cover" />
          <span v-else>{{ initials }}</span>
>>>>>>> 859b4f0f4e717efda43a0924a382bf5db5032b28
        </div>
        
        <div>
          <h4 class="text-sm font-bold text-slate-800 group-hover/author:text-indigo-600 group-hover/author:underline transition duration-150">
            {{ annonce.auteur?.prenom }} {{ annonce.auteur?.nom }}
          </h4>
          <p class="text-slate-400 text-xs font-medium">{{ dateAffichee }}</p>
        </div>
      </router-link>

      <span class="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md"
        :class="{
          'bg-indigo-100 text-indigo-700': annonce.type === 'AnnonceProjet', 
          'bg-emerald-100 text-emerald-700': annonce.type === 'AnnonceBonPlan',
          'bg-orange-100 text-orange-700': annonce.type === 'AnnonceTutorat',
          'bg-sky-100 text-sky-700': annonce.type === 'AnnonceExercice'
        }">
        {{ annonce.type.replace('Annonce', '') }}
      </span>
    </div>

    <div class="px-5 pb-4 space-y-3">
      
      <h3 class="text-lg font-extrabold text-slate-900 tracking-tight">
        <span v-if="annonce.titre">{{ annonce.titre }}</span>
        <span v-else-if="annonce.type === 'AnnonceExercice'">Exercice : {{ annonce.matiere?.titre || 'Ressource' }}</span>
        <span v-else-if="annonce.type === 'AnnonceTutorat'">Demande de Tutorat</span>
      </h3>

      <div class="flex flex-wrap gap-2 text-xs">
        <span v-if="annonce.matiere" class="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
          📚 {{ annonce.matiere.titre }}
        </span>
        <span v-if="annonce.annee" class="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
          🎓 {{ annonce.annee }}
        </span>
        <span v-if="annonce.sousType" class="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px]">
          🔥 {{ annonce.sousType.replace('_', ' ') }}
        </span>
        <span v-if="annonce.nbCandidatsVoulus" class="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg font-medium">
          👥 Besoin de : {{ annonce.nbCandidatsVoulus }} élève(s)
        </span>
      </div>

      <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
        {{ annonce.description }}
      </p>

      <div v-if="annonce.image" class="mt-3 rounded-xl overflow-hidden border border-slate-100 max-h-72 bg-slate-50">
        <img 
          :src="`${apiUrl}/uploads/${annonce.image}`" 
          alt="Illustration annonce" 
          class="w-full h-full object-cover hover:scale-[1.01] transition duration-300"
        />
      </div>

      <div v-if="annonce.lien" class="mt-2">
        <a 
          :href="annonce.lien" 
          target="_blank" 
          class="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition duration-150 w-full group"
          style="color: #6366F1;"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          <span class="truncate text-slate-700 group-hover:text-indigo-900">Ouvrir le lien externe : <span class="underline font-medium" style="color: #6366F1;">{{ annonce.lien }}</span></span>
        </a>
      </div>

    </div>

    <div class="px-5 py-3.5 bg-slate-50/50 border-t border-slate-50 flex gap-6 text-slate-500 text-sm font-medium">
      <button class="flex items-center gap-1.5 hover:text-red-500 transition cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
        <span>{{ annonce.nbJaime || 0 }}</span>
      </button>
      <button class="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        <span>Commenter</span>
      </button>
    </div>

<<<<<<< HEAD
    <AnnonceCommentaires 
      v-if="showCommentaires" 
      :annonce-id="annonce.id" 
      :annonceType="annonce.type" 
      @comment-added="localNbCommentaires++"
    />
=======
>>>>>>> 859b4f0f4e717efda43a0924a382bf5db5032b28
  </article>
</template>