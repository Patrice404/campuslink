<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'

// La modale s'affiche si isOpen est true
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// Le type sélectionné par défaut
const typeAnnonce = ref('EXERCICE')

// --- Variables du formulaire ---
// Communes
const texte = ref('')
const image = ref('')
const lien = ref('')

// Spécifiques
const titre = ref('')
const annee = ref('')
const id_matiere = ref('')
const sousType = ref('JOB_ETUDIANT')
const nbCandidatsVoulus = ref(1)

const handleSubmit = async () => {
  console.log("Préparation de l'envoi pour le type :", typeAnnonce.value)
  
  // Ici, tu mettras ton fetch vers /api/annonces/... en fonction du typeAnnonce.value
  // ...

  // Une fois terminé, on ferme la modale et on vide les champs
  emit('close')
  texte.value = ''
  titre.value = ''
}
</script>

<template>
  <!-- Fond sombre (Backdrop) -->
  <div 
    v-if="isOpen" 
    class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
    @click.self="$emit('close')"
  >
    <!-- Fenêtre de la modale -->
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- En-tête -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h3 class="text-lg font-bold text-gray-900">Créer une publication</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Corps (Formulaire défilant) -->
      <div class="p-6 overflow-y-auto">
        <form @submit.prevent="handleSubmit" class="space-y-5" id="postForm">
          
          <!-- Sélecteur du type d'annonce -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type de publication</label>
            <select 
              v-model="typeAnnonce" 
              class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white"
            >
              <option value="EXERCICE">Aide & Exercices</option>
              <option value="BON_PLAN">Bon Plan</option>
              <option value="TUTORAT">Tutorat</option>
              <option value="PROJET">Projet Étudiant</option>
            </select>
          </div>

          <!-- SECTION DYNAMIQUE : BON PLAN ou PROJET (Ont besoin d'un Titre) -->
          <div v-if="typeAnnonce === 'BON_PLAN' || typeAnnonce === 'PROJET'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input v-model="titre" type="text" required class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" placeholder="Ex: Recherche dev pour application Vue.js..." />
          </div>

          <!-- SECTION DYNAMIQUE : BON PLAN (A besoin d'un sous-type) -->
          <div v-if="typeAnnonce === 'BON_PLAN'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie du Bon Plan</label>
            <select v-model="sousType" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white">
              <option value="JOB_ETUDIANT">Job Étudiant</option>
              <option value="COLOCATION">Colocation</option>
              <option value="EVENEMENT">Évènement / Fête</option>
              <option value="RESTAURANT">Restaurant / Réduction</option>
            </select>
          </div>

          <!-- SECTION DYNAMIQUE : EXERCICE ou TUTORAT (Ont besoin d'une Matière et d'une Année) -->
          <div v-if="typeAnnonce === 'EXERCICE' || typeAnnonce === 'TUTORAT'" class="flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Année d'étude</label>
              <select v-model="annee" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white">
                <option value="L1">Licence 1</option>
                <option value="L2">Licence 2</option>
                <option value="L3">Licence 3</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Matière</label>
              <!-- Plus tard, tu remplaceras ça par une liste dynamique tirée de ta base de données -->
              <select v-model="id_matiere" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white">
                <option value="1">Mathématiques</option>
                <option value="2">Développement Web</option>
                <option value="3">Droit</option>
              </select>
            </div>
          </div>

          <!-- SECTION DYNAMIQUE : TUTORAT (A besoin du nombre de candidats) -->
          <div v-if="typeAnnonce === 'TUTORAT'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre d'élèves max</label>
            <input v-model="nbCandidatsVoulus" type="number" min="1" max="10" required class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" />
          </div>

          <!-- SECTION COMMUNE : Le Texte / Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              v-model="texte" 
              required 
              rows="4" 
              class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none resize-none" 
              placeholder="Écrivez votre message ici..."
            ></textarea>
          </div>

        </form>
      </div>

      <!-- Pied de page avec bouton -->
      <div class="px-6 py-4 border-t border-gray-100 bg-white">
        <BaseButton form="postForm" type="submit" variant="primary">
          Publier
        </BaseButton>
      </div>

    </div>
  </div>
</template>