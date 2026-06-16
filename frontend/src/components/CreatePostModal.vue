<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BaseButton from './BaseButton.vue'
import { useAuthStore } from '../stores/authStore'
import type { Matiere } from '../types'

const matieres = ref<Matiere[]>([])
const matieresLoading = ref(true)
const matieresError = ref<string | null>(null)

const authStore = useAuthStore()

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// --- Variables du formulaire ---

const typeAnnonce = ref('EXERCICE')
const visibilite = ref('PUBLIQUE') // NOUVEAU : Visibilité par défaut

// Communes
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const lien = ref('')
const description = ref('')

const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  imageFile.value = file

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
const titre = ref('')          
const annee = ref('L1')         
const id_matiere = ref('')     
const sousType = ref('JOB_ETUDIANT') 
const nbCandidatsVoulus = ref(1)     

const resetForm = () => {
  removeImage()
  typeAnnonce.value = 'EXERCICE'
  visibilite.value = 'PUBLIQUE'
  lien.value = ''
  description.value = ''
  titre.value = ''
  annee.value = 'L1'
  if (matieres.value.length > 0) id_matiere.value = String(matieres.value[0].id)
  sousType.value = 'JOB_ETUDIANT'
  nbCandidatsVoulus.value = 1
}

// État de la soumission
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const ENDPOINTS: Record<string, string> = {
  EXERCICE: 'exercice',
  BON_PLAN: 'bonplan',
  TUTORAT: 'tutorat',
  PROJET: 'projet',
}

// NOUVEAU : Récupération des matières filtrées par la formation de l'utilisateur
const fetchMatieres = async () => {
  matieresLoading.value = true
  matieresError.value = null
  try {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    
    // On passe l'id_formation en paramètre de requête si l'utilisateur en a un
    const formationId = authStore.user?.id_formation
    const url = formationId 
      ? `${apiUrl}/api/matieres?formationId=${formationId}` 
      : `${apiUrl}/api/matieres`

    const response = await fetch(url, {
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
    })
 
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }
 
    const data: Matiere[] = await response.json()
    matieres.value = data
 
    if (data.length > 0) {
      id_matiere.value = String(data[0].id)
    } else {
      id_matiere.value = ''
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des matières :', error)
    matieresError.value = 'Impossible de charger vos matières.'
  } finally {
    matieresLoading.value = false
  }
}

const handleSubmit = async () => {
  submitError.value = null
  const formData = new FormData()

  // Champs communs à toutes les annonces
  if (imageFile.value) formData.append('image', imageFile.value)
  if (lien.value) formData.append('lien', lien.value)
  formData.append('description', description.value)
  formData.append('visibilite', visibilite.value) // NOUVEAU : Envoi de la visibilité

  // Champs spécifiques
  switch (typeAnnonce.value) {
    case 'EXERCICE':
      formData.append('annee', annee.value)
      formData.append('id_matiere', id_matiere.value)
      break
    case 'BON_PLAN':
      formData.append('titre', titre.value)
      formData.append('sousType', sousType.value)
      break
    case 'TUTORAT':
      formData.append('annee', annee.value)
      formData.append('id_matiere', id_matiere.value)
      formData.append('nbCandidatsVoulus', String(nbCandidatsVoulus.value))
      break
    case 'PROJET':
      formData.append('titre', titre.value)
      break
  }

  const endpoint = ENDPOINTS[typeAnnonce.value]
  const apiUrl = import.meta.env.VITE_API_URL || ''

  isSubmitting.value = true
  try {
    const response = await fetch(`${apiUrl}/api/annonces/${endpoint}`, {
      method: 'POST',
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Erreur ${response.status} lors de la publication`)
    }

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
  // On ne charge les matières que si l'utilisateur est bien connecté
  if (authStore.isAuthenticated) {
    fetchMatieres()
  }
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h3 class="text-lg font-bold text-gray-900">Créer une publication</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto">
        <form @submit.prevent="handleSubmit" class="space-y-5" id="postForm">
          
          <div class="flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Type de publication</label>
              <select v-model="typeAnnonce" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white">
                <option value="EXERCICE">Aide & Exercices</option>
                <option value="BON_PLAN">Bon Plan</option>
                <option value="TUTORAT">Tutorat</option>
                <option value="PROJET">Projet</option>
              </select>
            </div>

            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Visibilité</label>
              <select v-model="visibilite" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white">
                <option value="PUBLIQUE">Publique</option>
                <option value="PROMOTION">Ma promotion</option>
                <option value="PROMO_SUPERIEUR">Ma promo & supérieures</option>
                <option value="ETUDIANT">Étudiants uniquement</option>
                <option value="PROFESSEUR">Professeurs uniquement</option>
              </select>
            </div>
          </div>

          <div v-if="typeAnnonce === 'BON_PLAN' || typeAnnonce === 'PROJET'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input v-model="titre" type="text" required class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" placeholder="Ex: Recherche dev pour application..." />
          </div>

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
              <select v-model="id_matiere" required class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white">
                <option v-if="matieresLoading" disabled value="">Chargement...</option>
                <option v-else-if="matieresError" disabled value="">{{ matieresError }}</option>
                <option v-else-if="matieres.length === 0" disabled value="">Aucune matière trouvée</option>
                <option v-else v-for="matiere in matieres" :key="matiere.id" :value="String(matiere.id)">
                  {{ matiere.titre }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="typeAnnonce === 'TUTORAT'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre d'élèves max</label>
            <input v-model.number="nbCandidatsVoulus" type="number" min="1" max="10" required class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              v-model="description" 
              required 
              rows="4" 
              class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none resize-none" 
              placeholder="Détaillez votre publication..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Lien (optionnel)</label>
            <input v-model="lien" type="url" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none" placeholder="https://..." />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Image (optionnel)</label>
            <input ref="fileInput" type="file" accept="image/png, image/jpeg, image/webp, image/gif" class="hidden" @change="handleFileChange" />
            
            <div v-if="imagePreview" class="relative inline-block">
              <img :src="imagePreview" alt="Aperçu" class="h-32 w-auto rounded-lg border border-gray-200 object-cover" />
              <button type="button" @click="removeImage" class="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 text-gray-500 hover:text-red-600 border border-gray-200">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button v-else type="button" @click="triggerFileInput" class="w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-secondary hover:text-secondary transition-colors flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5" />
              </svg>
              Choisir une image
            </button>
          </div>

        </form>
      </div>

      <div class="px-6 py-4 border-t border-gray-100 bg-white">
        <p v-if="submitError" class="text-sm text-red-600 mb-2">{{ submitError }}</p>
        <BaseButton form="postForm" type="submit" variant="primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Publication en cours...' : 'Publier' }}
        </BaseButton>
      </div>

    </div>
  </div>
</template>