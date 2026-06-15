<script setup lang="ts">
// On déclare l'événement que ce composant peut envoyer
defineEmits(['open-menu'])

const createPost = () => {
  console.log("Ouvrir la modale de nouveau post")
}
</script>

<template>
  <header class="h-16 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
    
    <div class="flex items-center gap-3 flex-1">
      <button 
        @click="$emit('open-menu')" 
        class="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <h1 class="text-xl font-bold text-gray-800">Fil d'actualité</h1>
    </div>

    <div class="flex items-center gap-3 md:gap-4">
      <button class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        <span class="absolute top-1.5 right-1.5 block w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
      </button>

      <button 
        @click="createPost"
        class="flex items-center gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm text-sm md:text-base"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span class="hidden md:inline">Nouveau Post</span> </button>
    </div>
  </header>
</template>