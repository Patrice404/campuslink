<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseButton from './BaseButton.vue'
import { useAuthStore } from '../stores/authStore'
import type { Matiere } from '../types'

const matieres = ref<Matiere[]>([])
const matieresLoading = ref(true)
const matieresError = ref<string | null>(null)

const authStore = useAuthStore()

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

// Communes à (presque) toutes les annonces
const imageFile = ref<File | null>(null)   // Le fichier sélectionné, envoyé via FormData
const imagePreview = ref<string | null>(null) // Aperçu local (URL temporaire)
const lien = ref('')

// Élément <input type="file"> caché, déclenché par le bouton custom
const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  imageFile.value = file

  // Génère un aperçu local de l'image choisie
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = file ? URL.createObjectURL(file) : null
}

const removeImage = () => {
  imageFile.value = null
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
    imagePreview.value = null
  }
  if (fileInput.value) fileInput.value.value = ''
}

// Spécifiques

const description = ref('')
const titre = ref('')          // BON_PLAN, PROJET
const annee = ref('L1')         // EXERCICE, TUTORAT
const id_matiere = ref('1')     // EXERCICE, TUTORAT
const sousType = ref('JOB_ETUDIANT') // BON_PLAN
const nbCandidatsVoulus = ref(1)     // TUTORAT

const resetForm = () => {
  removeImage()
  lien.value = ''
  description.value = ''
  titre.value = ''
  annee.value = 'L1'
  id_matiere.value = '1'
  sousType.value = 'JOB_ETUDIANT'
  nbCandidatsVoulus.value = 1
}

// État de la soumission
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

// Correspondance type d'annonce -> endpoint API (un endpoint dédié par type)
const ENDPOINTS: Record<string, string> = {
  EXERCICE: 'exercice',
  BON_PLAN: 'bonplan',
  TUTORAT: 'tutorat',
  PROJET: 'projet',
}
const fetchMatieres = async () => {
  matieresLoading.value = true
  matieresError.value = null
  try {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${apiUrl}/api/matieres`, {
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
    })
 
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }
 
    const data: Matiere[] = await response.json()
    matieres.value = data
 
    // Pré-sélectionne la première matière si aucune n'est encore choisie
    if (data.length > 0) {
      id_matiere.value = String(data[0].id)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des matières :', error)
    matieresError.value = 'Impossible de charger la liste des matières.'
  } finally {
    matieresLoading.value = false
  }
}



const handleSubmit = async () => {
  submitError.value = null

  // On utilise FormData car on envoie un fichier (image) en plus des champs texte.
  // Le backend (multer ou équivalent) enregistrera le fichier sur le disque
  // et stockera le chemin (ex: "/uploads/annonces/xxxx.jpg") dans la BDD.
  const formData = new FormData()

  if (imageFile.value) {
    formData.append('image', imageFile.value)
  }
  formData.append('lien', lien.value)

  switch (typeAnnonce.value) {
    case 'EXERCICE':
      formData.append('description', description.value)
      formData.append('annee', annee.value)
      formData.append('id_matiere', id_matiere.value)
      break
    case 'BON_PLAN':
      formData.append('titre', titre.value)
      formData.append('description', description.value)
      formData.append('sousType', sousType.value)
      break
    case 'TUTORAT':
      formData.append('description', description.value)
      formData.append('annee', annee.value)
      formData.append('id_matiere', id_matiere.value)
      formData.append('nbCandidatsVoulus', String(nbCandidatsVoulus.value))
      break
    case 'PROJET':
      formData.append('titre', titre.value)
      formData.append('description', description.value)
      break
  }

  const endpoint = ENDPOINTS[typeAnnonce.value]
  const apiUrl = import.meta.env.VITE_API_URL || ''

  isSubmitting.value = true
  try {
    const response = await fetch(`${apiUrl}/api/annonces/${endpoint}`, {
      // IMPORTANT : ne pas fixer le header 'Content-Type' manuellement avec FormData,
      // le navigateur s'en occupe (avec la bonne boundary multipart).
      method: 'POST',
      headers: {
        // On envoie le token pour prouver que l'utilisateur est connecté
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Erreur ${response.status} lors de la publication`)
    }

    // On peut récupérer l'annonce créée si le backend la renvoie
    // const annonceCreee = await response.json()

    emit('close')
    resetForm()
  } catch (error) {
    console.error('Erreur lors de la création de l\'annonce :', error)
    submitError.value = "Une erreur est survenue lors de la publication. Veuillez réessayer."
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchMatieres()
})

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

          <!-- SECTION DYNAMIQUE : BON PLAN (A besoin d'un sous-type complet, conforme au schéma) -->
          <div v-if="typeAnnonce === 'BON_PLAN'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie du Bon Plan</label>
            <select v-model="sousType" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white">
              <option value="JOB_ETUDIANT">Job Étudiant</option>
              <option value="ALTERNANCE">Alternance</option>
              <option value="COLOCATION">Colocation</option>
              <option value="FETE">Fête</option>
              <option value="EVENEMENT">Évènement</option>
              <option value="RESTAURANT">Restaurant / Réduction</option>
              <option value="BOURSE">Bourse</option>
              <option value="HACKATHON">Hackathon</option>
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
                <option v-if="matieresLoading" disabled>Chargement...</option>
                <option v-else-if="matieresError" disabled>{{ matieresError }}</option>
                <option v-else v-for="matiere in matieres" :key="matiere.id" :value="String(matiere.id)">
                  {{ matiere.titre }}
                </option>
              </select>
            </div>
          </div>

          <!-- SECTION DYNAMIQUE : TUTORAT (A besoin du nombre de candidats) -->
          <div v-if="typeAnnonce === 'TUTORAT'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre d'élèves max</label>
            <input v-model.number="nbCandidatsVoulus" type="number" min="1" max="10" required class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" />
          </div>

         

          <!-- Pour TUTORAT -> champ "description" du schéma -->
          <div v-if="typeAnnonce === 'TUTORAT'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description de l'annonce de tutorat</label>
            <textarea 
              v-model="description" 
              required 
              rows="4" 
              class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none resize-none" 
              placeholder="Décrivez ce que vous proposez (niveau, disponibilités, modalités...)"
            ></textarea>
          </div>

          <!-- SECTION COMMUNE :  champ "description" supplémentaire du schéma -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description </label>
            <textarea 
              v-model="description" 
              required 
              rows="4" 
              class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none resize-none" 
              placeholder="Détaillez le projet : objectifs, technologies, profil recherché..."
            ></textarea>
          </div>

          <!-- SECTION COMMUNE : Lien -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Lien (optionnel)</label>
            <input v-model="lien" type="url" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" placeholder="https://..." />
          </div>

          <!-- SECTION COMMUNE : Image (upload de fichier, stocké sur le disque côté backend) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Image (optionnel)</label>

            <!-- Input file caché -->
            <input
              ref="fileInput"
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              class="hidden"
              @change="handleFileChange"
            />

            <!-- Aperçu de l'image sélectionnée -->
            <div v-if="imagePreview" class="relative inline-block">
              <img :src="imagePreview" alt="Aperçu de l'image" class="h-32 w-auto rounded-lg border border-gray-200 object-cover" />
              <button
                type="button"
                @click="removeImage"
                class="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 text-gray-500 hover:text-red-600 border border-gray-200"
                aria-label="Retirer l'image"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Bouton de sélection (affiché si aucune image choisie) -->
            <button
              v-else
              type="button"
              @click="triggerFileInput"
              class="w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-secondary hover:text-secondary transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5" />
              </svg>
              Choisir une image
            </button>
          </div>

        </form>
      </div>

      <!-- Pied de page avec bouton -->
      <div class="px-6 py-4 border-t border-gray-100 bg-white">
        <p v-if="submitError" class="text-sm text-red-600 mb-2">{{ submitError }}</p>
        <BaseButton form="postForm" type="submit" variant="primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Publication en cours...' : 'Publier' }}
        </BaseButton>
      </div>

    </div>
  </div>
</template>