<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import BaseButton from './BaseButton.vue'
import { useAuthStore } from '../stores/authStore'
import type { Matiere } from '../types'

const matieres = ref<Matiere[]>([])
const matieresLoading = ref(true)
const matieresError = ref<string | null>(null)

// ⚡️ NOUVEAUX ÉTATS POUR LES SOUS-TYPES DYNAMIQUES
const sousTypes = ref<string[]>([])
const sousTypesLoading = ref(true)
const sousTypesError = ref<string | null>(null)

const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  annonceToEdit: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'post-created'])

const isEditMode = computed(() => !!props.annonceToEdit)

// --- Variables du formulaire ---
const typeAnnonce = ref('EXERCICE')
const visibilite = ref('PUBLIQUE')

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

  if (imagePreview.value && !imagePreview.value.startsWith(apiUrl)) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = file ? URL.createObjectURL(file) : null
}

const removeImage = () => {
  imageFile.value = null
  if (imagePreview.value && !imagePreview.value.startsWith(apiUrl)) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Spécifiques
const titre = ref('')          
const annee = ref('L1')         
const id_matiere = ref('')     
const sousType = ref('') // ⚡️ Initialisé vide pour accueillir la valeur dynamique
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
  // ⚡️ Reset sur le premier sous-type de la BDD s'il existe
  sousType.value = sousTypes.value.length > 0 ? sousTypes.value[0] : 'JOB_ETUDIANT'
  nbCandidatsVoulus.value = 1
}

watch(() => props.annonceToEdit, (newAnnonce) => {
  if (newAnnonce) {
    let cleanType = newAnnonce.type.replace('Annonce', '')
    if (cleanType === 'BonPlan') cleanType = 'BON_PLAN'
    typeAnnonce.value = cleanType.toUpperCase()

    visibilite.value = newAnnonce.visibilite || 'PUBLIQUE'
    description.value = newAnnonce.description || newAnnonce.texte || ''
    lien.value = newAnnonce.lien || ''
    titre.value = newAnnonce.titre || ''
    annee.value = newAnnonce.annee || 'L1'
    id_matiere.value = newAnnonce.id_matiere ? String(newAnnonce.id_matiere) : ''
    sousType.value = newAnnonce.sousType || ''
    nbCandidatsVoulus.value = newAnnonce.nbCandidatsVoulus || 1

    const existingFile = newAnnonce.image || newAnnonce.photo
    if (existingFile) {
      imagePreview.value = `${apiUrl}/uploads/${existingFile}`
    } else {
      imagePreview.value = null
    }
    imageFile.value = null
  } else {
    resetForm()
  }
}, { immediate: true })

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

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
    const formationId = authStore.user?.id_formation
    const url = formationId 
      ? `${apiUrl}/api/matieres?formationId=${formationId}` 
      : `${apiUrl}/api/matieres`

    const response = await fetch(url, {
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
    })
 
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)
 
    const data: Matiere[] = await response.json()
    matieres.value = data
 
    if (data.length > 0 && !isEditMode.value) {
      id_matiere.value = String(data[0].id)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des matières :', error)
    matieresError.value = 'Impossible de charger vos matières.'
  } finally {
    matieresLoading.value = false
  }
}

// ⚡️ NOUVELLE FONCTION : Récupère les enums SousTypeBonPlan depuis le backend
const fetchSousTypes = async () => {
  sousTypesLoading.value = true
  sousTypesError.value = null
  try {
    const response = await fetch(`${apiUrl}/api/annonces/bonplan/soustypes`, {
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
    })

    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)

    const data: string[] = await response.json()
    sousTypes.value = data

    // Si on est en mode création, on sélectionne par défaut le premier élément reçu
    if (data.length > 0 && !isEditMode.value) {
      sousType.value = data[0]
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des sous-types :', error)
    sousTypesError.value = 'Impossible de charger les catégories.'
  } finally {
    sousTypesLoading.value = false
  }
}

// ⚡️ FONCTION UTILITAIRE : Traduit les enums de la BDD en chaînes élégantes pour l'UI
const getSousTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    JOB_ETUDIANT: 'Job Étudiant',
    ALTERNANCE: 'Alternance',
    COLOCATION: 'Colocation',
    FETE: 'Fête',
    EVENEMENT: 'Évènement',
    RESTAURANT: 'Restaurant / Réduction',
    BOURSE: 'Bourse',
    HACKATHON: 'Hackathon'
  }
  return labels[type] || type.replace('_', ' ')
}

const handleSubmit = async () => {
  submitError.value = null
  const formData = new FormData()

  if (imageFile.value) formData.append('image', imageFile.value)
  if (isEditMode.value && !imagePreview.value) {
    formData.append('deleteImage', 'true')
  }

  if (lien.value) formData.append('lien', lien.value)
  formData.append('description', description.value)
  formData.append('visibilite', visibilite.value) 

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
  
  const targetUrl = isEditMode.value
    ? `${apiUrl}/api/annonces/${endpoint}/${props.annonceToEdit.id}`
    : `${apiUrl}/api/annonces/${endpoint}`

  const targetMethod = isEditMode.value ? 'PUT' : 'POST'

  isSubmitting.value = true
  try {
    const response = await fetch(targetUrl, {
      method: targetMethod,
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const messageErreur = errorData.message || "Une erreur est survenue lors de l'enregistrement.";
      throw new Error(messageErreur);
    }

    emit('post-created')
    emit('close')
    resetForm()
  } catch (error: any) {
    console.error("Erreur complète :", error);
    submitError.value = error.message;
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchMatieres()
    fetchSousTypes() // ⚡️ Lancement de la récupération au montage du composant
  }
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h3 class="text-lg font-bold text-gray-900">
          {{ isEditMode ? 'Modifier la publication' : 'Créer une publication' }}
        </h3>
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
              <select :disabled="isEditMode" v-model="typeAnnonce" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500">
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
            <select v-model="sousType" required class="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none bg-white">
              <option v-if="sousTypesLoading" disabled value="">Chargement des catégories...</option>
              <option v-else-if="sousTypesError" disabled value="">{{ sousTypesError }}</option>
              <option v-else v-for="type in sousTypes" :key="type" :value="type">
                {{ getSousTypeLabel(type) }}
              </option>
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
                <option v-else v-for="matiere in matieres" :key="matiere.id.toString()" :value="String(matiere.id)">
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
          {{ isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Enregistrer les modifications' : 'Publier') }}
        </BaseButton>
      </div>

    </div>
  </div>
</template>