<script setup lang="ts">
import type { Campus } from '../types/'

// On déclare que ce composant accepte une propriété "campus"
defineProps<{
  campus: Campus
}>()
</script>

<template>
  <button 
    class="flex flex-col items-center p-8 w-full bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-primary transition-all group"
  >
    <div class="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
    
    <h3 class="text-xl font-bold text-gray-800">{{ campus.nom }}</h3>
    <p class="text-gray-500 mt-2">{{ campus.ville }}</p>
    <p class="text-xs text-gray-400 mt-1">{{ campus.etablissement }}</p>
  </button>
</template>