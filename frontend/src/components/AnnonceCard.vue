<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  annonce: any
}>();

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
        {{ annonce.type ? annonce.type.replace('Annonce', '') : '' }}
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
        {{ annonce.description || annonce.description }}
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

  </article>
</template>