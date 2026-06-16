<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Campus } from '../types/'
import CampusCard from '../components/CampusCard.vue' 
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()


// 2. Variables réactives pour gérer les 3 états (Chargement, Données, Erreur)
const campuses = ref<Campus[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

// 3. Fonction pour récupérer les campus depuis l'API Express
const fetchCampuses = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // Utilisation de la variable d'environnement (Port 3000 selon ton code backend)
    const apiUrl = import.meta.env.VITE_API_URL
    
    const response = await fetch(`${apiUrl}/api/campus`)
    console.log("Réponse brute de l'API :", response)
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    const data = await response.json()
    campuses.value = data

  } catch (error) {
    console.error("Erreur lors de la récupération des campus :", error)
    errorMessage.value = "Impossible de charger les établissements. Veuillez réessayer plus tard."
  } finally {
    // Qu'il y ait une erreur ou un succès, on arrête le chargement
    isLoading.value = false
  }
}

// 4. Lancement de la requête dès que le composant est monté (affiché)
onMounted(() => {
  fetchCampuses()
})

const handleSelect = (campusId: number) => {
  // On stocke l'ID dans le store global avant de changer de page
  authStore.setCampusId(campusId)
  router.push('/login')
}

</script>

<template>
  <div class="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 p-6">
    
    <div class="text-center mb-10">
      <h1 class="text-4xl font-extrabold text-gray-900 mb-4">CampusLink</h1>
      <p class="text-lg text-gray-600">Sélectionnez votre établissement pour commencer</p>
    </div>

    <div class="w-full max-w-5xl">
      
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="errorMessage" class="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-200">
        <p class="font-medium">{{ errorMessage }}</p>
        <button @click="fetchCampuses" class="mt-3 text-sm underline hover:text-red-800">Réessayer</button>
      </div>

     <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
    
      <CampusCard 
        v-for="campus in campuses" 
        :key="Number(campus.id)"
        :campus="campus" 
        @click="handleSelect(Number(campus.id))"
      />

    </div>

      <div v-if="!isLoading && !errorMessage && campuses.length === 0" class="text-center text-gray-500 py-8">
        Aucun campus n'est disponible pour le moment.
      </div>

    </div>
  </div>
</template>