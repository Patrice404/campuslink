<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';
import AnnoncesCommentaires from './AnnoncesCommentaires.vue';

const props = defineProps<{
  annonce: any
}>();

const emit = defineEmits(['deleted', 'edit']);
const showDeleteConfirm = ref(false);

const authStore = useAuthStore();
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

// --- ÉTATS LOCAUX (Likes & Commentaires) ---
const nbJaimeLocal = ref(Number(props.annonce.nbJaime) || 0);
const isLikedLocal = ref(props.annonce.isLikedByMe || false);
const nbCommentairesLocal = ref(Number(props.annonce.nbCommentaires ?? props.annonce.commentaires?.length ?? 0));
const showCommentaires = ref(false);
const showDropdown = ref(false);

// --- ÉTAT LOCAL DE TRONCATURE DU TEXTE ("VOIR PLUS") ---
const isExpanded = ref(false);
const maxCharacters = 280; // Nombre de caractères maximum avant l'apparition du bouton

/**
 * Vérifie si l'utilisateur connecté est le propriétaire de l'annonce.
 */
const isOwner = computed(() => {
  const currentUserId = authStore.user?.id; 
  const auteurId = props.annonce.auteur?.id;
  if (!currentUserId || !auteurId) return false;
  return String(currentUserId) === String(auteurId);
});

const triggerDeleteConfirmation = () => {
  showDropdown.value = false; 
  showDeleteConfirm.value = true; 
};

const handleEditClick = () => {
  showDropdown.value = false; 
  emit('edit', props.annonce); 
};

// Synchronisation si les props changent
watch(() => props.annonce, (newAnnonce) => {
  nbJaimeLocal.value = Number(newAnnonce.nbJaime) || 0;
  isLikedLocal.value = newAnnonce.isLikedByMe || false;
  nbCommentairesLocal.value = Number(newAnnonce.nbCommentaires ?? newAnnonce.commentaires?.length ?? 0);
}, { deep: true });

// Formater la date proprement
const dateAffichee = computed(() => {
  if (!props.annonce.datePublication) return "Récemment";
  return new Date(props.annonce.datePublication).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
});

// Générer les initiales de l'auteur en cas d'absence d'avatar
const initials = computed(() => {
  const auteur = props.annonce.auteur;
  if (!auteur) return "?";
  return `${auteur.prenom?.[0] || ""}${auteur.nom?.[0] || ""}`.toUpperCase();
});

// --- DÉTECTION INTELLIGENTE DU FICHIER IMAGE ---
const imageSource = computed(() => {
  const fileField = props.annonce.image;
  if (!fileField) return null;
  return `${fileField}`;
});

// --- LOGIQUE DE CALCUL DU TEXTE TRONQUÉ ---
// Récupère le texte brut peu importe le champ renvoyé par le backend
const texteGlobal = computed(() => {
  return props.annonce.description || props.annonce.texte || "";
});

// Vérifie si le texte dépasse la limite et a besoin d'être tronqué
const isLongText = computed(() => {
  return texteGlobal.value.length > maxCharacters;
});

// Renvoie le texte final à afficher (complet ou tronqué)
const texteAffiche = computed(() => {
  if (!isLongText.value || isExpanded.value) {
    return texteGlobal.value;
  }
  return texteGlobal.value.slice(0, maxCharacters) + "...";
});

// --- LOGIQUE DU LIKE SYNCHRONISÉ ---
const handleLikeToggle = async () => {
  if (!authStore.token) {
    alert("Vous devez être connecté pour aimer une annonce.");
    return;
  }

  let typePrisma = props.annonce.type;
  if (typePrisma === 'AnnonceExercice') typePrisma = 'EXERCICE';
  if (typePrisma === 'AnnonceBonPlan') typePrisma = 'BON_PLAN';
  if (typePrisma === 'AnnonceTutorat') typePrisma = 'TUTORAT';
  if (typePrisma === 'AnnonceProjet') typePrisma = 'PROJET';

  const annonceIdStr = String(props.annonce.id);

  // Changement optimiste de l'UI
  if (isLikedLocal.value) {
    nbJaimeLocal.value = Math.max(0, nbJaimeLocal.value - 1);
    isLikedLocal.value = false;
  } else {
    nbJaimeLocal.value++;
    isLikedLocal.value = true;
  }

  try {
    const response = await fetch(`${apiUrl}/api/annonces/${annonceIdStr}/jaime?type=${typePrisma}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      isLikedLocal.value = data.jaime;
    } else {
      isLikedLocal.value = !isLikedLocal.value;
      nbJaimeLocal.value = isLikedLocal.value ? nbJaimeLocal.value + 1 : Math.max(0, nbJaimeLocal.value - 1);
    }
  } catch (error) {
    console.error("Erreur réseau Like:", error);
    isLikedLocal.value = !isLikedLocal.value;
    nbJaimeLocal.value = isLikedLocal.value ? nbJaimeLocal.value + 1 : Math.max(0, nbJaimeLocal.value - 1);
  }
};

/**
 * Supprime l'annonce après confirmation.
 */
const executeDelete = async () => {
  let typeRoute = props.annonce.type.replace('Annonce', '').toLowerCase();

  const annonceIdStr = String(props.annonce.id);
  showDeleteConfirm.value = false;

  try {
    const response = await fetch(`${apiUrl}/api/annonces/${typeRoute}/${annonceIdStr}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    if (response.ok) {
      emit('deleted');
    } else {
      const errorData = await response.json().catch(() => ({}));
      alert(errorData.message || "Impossible de supprimer l'annonce.");
    }
  } catch (error) {
    console.error("Erreur réseau Delete:", error);
  }
};
</script>

<template>
  <article class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition duration-200">
    
    <div class="p-5 pb-3 flex items-center justify-between relative">
      <router-link 
        v-if="annonce.auteur?.uuid" 
        :to="'/profil/' + annonce.auteur.uuid" 
        class="flex items-center gap-3 group/author cursor-pointer"
      >
        <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-sm group-hover/author:border-indigo-400 transition duration-150">
          <img v-if="annonce.auteur?.photoProfil" :src="`${annonce.auteur.photoProfil}`" alt="Avatar" class="w-full h-full object-cover" />
          <span v-else>{{ initials }}</span>
        </div>
        
        <div>
          <h4 class="text-sm font-bold text-slate-800 group-hover/author:text-indigo-600 group-hover/author:underline transition duration-150">
            {{ annonce.auteur?.prenom }} {{ annonce.auteur?.nom }}
          </h4>
          <p class="text-slate-400 text-xs font-medium">{{ dateAffichee }}</p>
        </div>
      </router-link>

      <div class="flex items-center gap-2">
        <span v-if="annonce.sousTypeTypeFront" class="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md"
          :class="{
            'bg-orange-100 text-orange-700': annonce.sousTypeTypeFront === 'TUTORAT',
            'bg-sky-100 text-sky-700': annonce.sousTypeTypeFront === 'EXERCICE'
          }">
          {{ annonce.sousTypeTypeFront === 'TUTORAT' ? '🤝 Tutorat' : '📝 Exercice' }}
        </span>
        <span v-else class="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md"
          :class="{
            'bg-indigo-100 text-indigo-700': annonce.type === 'AnnonceProjet', 
            'bg-emerald-100 text-emerald-700': annonce.type === 'AnnonceBonPlan',
            'bg-orange-100 text-orange-700': annonce.type === 'AnnonceTutorat',
            'bg-sky-100 text-sky-700': annonce.type === 'AnnonceExercice'
          }">
          {{ annonce.type ? annonce.type.replace('Annonce', '') : '' }}
        </span>

        <div v-if="isOwner" class="relative">
          <button 
            @click.stop="showDropdown = !showDropdown" 
            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>

          <div 
            v-if="showDropdown" 
            class="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-10 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <button 
              @click.stop="handleEditClick" 
              class="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
               Modifier
            </button>
            <button 
              @click.stop="triggerDeleteConfirmation" 
              class="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
            >
               Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="px-5 pb-4 space-y-3">
      
      <h3 class="text-lg font-extrabold text-slate-900 tracking-tight">
        <span v-if="annonce.titre">{{ annonce.titre }}</span>
        <span v-else-if="annonce.sousTypeTypeFront === 'EXERCICE' || annonce.type === 'AnnonceExercice'">Exercice : {{ annonce.matiere?.titre || 'Ressource' }}</span>
        <span v-else-if="annonce.sousTypeTypeFront === 'TUTORAT' || annonce.type === 'AnnonceTutorat'">Demande de Tutorat : {{ annonce.matiere?.titre || 'Aide' }}</span>
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
        <span v-if="annonce.nbCandidatsVoulus" class="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg font-semibold border border-orange-100">
          👥 Places disponibles : {{ annonce.nbCandidatsVoulus }} élève(s)
        </span>
      </div>

      <div>
        <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
          {{ texteAffiche }}
        </p>
        
        <button 
          v-if="isLongText"
          @click="isExpanded = !isExpanded"
          class="mt-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition duration-150 inline-flex items-center gap-0.5 cursor-pointer hover:underline"
        >
          <span>{{ isExpanded ? "Voir moins" : "Voir plus" }}</span>
          <svg 
            class="w-3.5 h-3.5 transition-transform duration-200" 
            :class="{ 'rotate-180': isExpanded }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div v-if="imageSource" class="mt-3 rounded-xl overflow-hidden border border-slate-100 max-h-72 bg-slate-50">
        <img 
          :src="imageSource" 
          alt="Illustration annonce" 
          class="w-full h-full object-cover hover:scale-[1.01] transition duration-300"
        />
      </div>

      <div v-if="annonce.lien" class="mt-2">
        <a 
          :src="annonce.lien" 
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
      <button @click="handleLikeToggle" class="flex items-center gap-1.5 transition cursor-pointer group" :class="isLikedLocal ? 'text-red-500 font-bold' : 'hover:text-red-500'">
        <svg class="w-4 h-4 transition duration-150" :fill="isLikedLocal ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
        <span>{{ nbJaimeLocal }}</span>
      </button>
      
      <button @click="showCommentaires = !showCommentaires" class="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer" :class="{ 'text-indigo-600 font-bold': showCommentaires }">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        <span>{{ nbCommentairesLocal }}</span>
      </button>
    </div>

    <div v-if="showCommentaires">
      <AnnoncesCommentaires :annonceId="annonce.id" :annonceType="annonce.type" @comment-added="nbCommentairesLocal++" />
    </div>

    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
      
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-150">
        <h3 class="text-base font-bold text-slate-900 mb-1">
          Supprimer la publication ?
        </h3>
        <p class="text-slate-500 text-sm mb-6 leading-relaxed">
          Cette action est irréversible. Votre annonce sera définitivement retirée du fil d'actualité du campus.
        </p>
        
        <div class="flex gap-3 justify-end">
          <button 
            @click="showDeleteConfirm = false" 
            class="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition cursor-pointer"
          >
            Annuler
          </button>
          <button 
            @click="executeDelete" 
            class="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200 rounded-xl transition cursor-pointer"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  </article>
</template>