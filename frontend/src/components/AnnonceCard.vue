<script setup lang="ts">
// On redéfinit (ou on importe) les types pour TypeScript
interface Utilisateur {
  id: number;
  prenom: string;
  nom: string;
  photoProfil?: string;
}

interface Annonce {
  id: number;
  type: string;
  datePublication: string;
  nbJaime: number;
  image?: string;
  lien?: string;
  auteur: Utilisateur;
  nbCommentaires: number;
  titre?: string;
  texte?: string;
  description?: string;
  annee?: string;
  sousType?: string;
  nbCandidatsVoulus?: number;
}

// Déclaration de la Prop "annonce" reçue du parent
defineProps<{
  annonce: Annonce;
}>();

// Fonctions utilitaires propres à la carte d'annonce
const getInitials = (prenom?: string, nom?: string) => {
  return `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
  };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};
</script>

<template>
  <article class="bg-white rounded-xl shadow-sm hover:shadow transition duration-200 overflow-hidden">
    <div class="p-5">

      <div class="flex justify-between items-start mb-4">
        
        <router-link 
          :to="`/profil/${annonce.auteur.id}`" 
          class="flex items-center gap-3 hover:opacity-75 transition"
        >
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
        
        <span class="text-xs font-bold px-3 py-1 rounded-full" 
              :class="{
                'bg-green-100 text-green-700': annonce.type === 'AnnonceBonPlan',
                'bg-purple-100 text-purple-700': annonce.type === 'AnnonceTutorat',
                'bg-blue-100 text-blue-700': annonce.type === 'AnnonceProjet',
                'bg-orange-100 text-orange-700': annonce.type === 'AnnonceExercice'
              }">
          {{ annonce.type.replace('Annonce', '') }}
        </span>
      </div>

      <div class="mt-2">
        <h2 v-if="annonce.titre" class="text-lg font-bold text-gray-900 mb-1">
          {{ annonce.titre }}
        </h2>
        
        <p v-if="annonce.texte" class="text-gray-700 whitespace-pre-line mb-2">
          {{ annonce.texte }}
        </p>
        
        <p v-if="annonce.description" class="text-gray-700 whitespace-pre-line italic mb-2">
          {{ annonce.description }}
        </p>

        <div class="flex flex-wrap gap-2 mt-3">
          <span v-if="annonce.sousType" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            Catégorie : {{ annonce.sousType }}
          </span>
          <span v-if="annonce.annee" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            Année : {{ annonce.annee }}
          </span>
          <span v-if="annonce.nbCandidatsVoulus" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            Cherche : {{ annonce.nbCandidatsVoulus }} personne(s)
          </span>
        </div>
      </div>

    </div> <div class="bg-gray-50 px-5 py-3 border-t border-gray-100 flex gap-6 text-gray-500 font-medium text-sm">
      <button class="flex items-center gap-2 hover:text-red-500 transition">
        <span>❤️</span> {{ annonce.nbJaime }}
      </button>
      <button class="flex items-center gap-2 hover:text-blue-600 transition">
        <span>💬</span> {{ annonce.nbCommentaires }}
      </button>
    </div>
  </article>
</template>