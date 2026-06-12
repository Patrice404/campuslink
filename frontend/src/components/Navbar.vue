<script setup lang="ts">
    import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="bg-blue-600 text-white shadow-md">
    <nav class="container mx-auto p-4 flex justify-between items-center">
      <div class="flex gap-6">
        <RouterLink to="/accueil" class="hover:text-blue-200 font-bold transition-colors">Accueil</RouterLink>
        <RouterLink to="/projets" class="hover:text-blue-200 font-bold transition-colors">Projets</RouterLink>
      </div>
      <div>
        <RouterLink to="/" class="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
          Quitter
        </RouterLink>
      </div>
    </nav>
  </header>
</template>