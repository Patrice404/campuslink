<script setup lang="ts">
import { computed } from 'vue'

// 1. Définir les propriétés que le composant peut recevoir
const props = defineProps({
  variant: {
    type: String,
    default: 'primary' // Options : 'primary', 'secondary', 'outline'
  },
  type: {
    type: String as () => 'button' | 'submit' | 'reset',
    default: 'button'
  }
})

// 2. Les classes communes à TOUS les boutons
const baseClasses = "w-full py-3 px-4 font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"

// 3. Les classes spécifiques selon la variante choisie
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return "text-white bg-primary hover:opacity-90"
    case 'secondary':
      return "text-white bg-secondary hover:opacity-90"
    case 'outline':
      return "text-gray-700 bg-white border-2 border-gray-200 hover:border-secondary hover:text-secondary hover:bg-gray-50 font-medium"
    default:
      return "text-white bg-primary hover:opacity-90"
  }
})
</script>

<template>
  <button :type="type" :class="[baseClasses, variantClasses]">
    <slot />
  </button>
</template>