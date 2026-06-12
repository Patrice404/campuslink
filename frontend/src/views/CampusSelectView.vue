<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Une fausse liste de campus (qui viendra de la BDD plus tard)
const campuses = [
  { id: 1, name: "IUT Bourges", city: "Bourges" },
  { id: 2, name: "Université d'Orléans", city: "Orléans" },
  { id: 3, name: "Campus Châteauroux", city: "Châteauroux" },
]

// Fonction quand on clique sur un campus
const handleSelect = (campusId: number) => {
  console.log("Campus sélectionné :", campusId)
  // Plus tard, on sauvegardera ce choix en mémoire, mais pour l'instant :
  // On redirige l'étudiant vers la page de connexion !
  router.push('/login')
}
</script>

<template>
  <div class="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 p-6">
    
    <div class="text-center mb-10">
      <h1 class="text-4xl font-extrabold text-gray-900 mb-4">CampusLink</h1>
      <p class="text-lg text-gray-600">Sélectionnez votre établissement pour commencer</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
      
      <button 
        v-for="campus in campuses" 
        :key="campus.id"
        @click="handleSelect(campus.id)"
        class="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-primary transition-all group"
      >
        <div class="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800">{{ campus.name }}</h3>
        <p class="text-gray-500 mt-2">{{ campus.city }}</p>
      </button>

    </div>
  </div>
</template>