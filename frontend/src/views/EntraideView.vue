<script setup lang="ts">
import AnnonceFeedLayout from '../components/AnnonceFeedLayout.vue'
</script>

<template>
  <AnnonceFeedLayout 
    page-title="Espace Entraide & Devoirs"
    page-subtitle="Trouve de l'aide ou propose tes compétences sur les exercices bloquants."
    api-endpoint="entraide"
    card-type="AnnonceExercice"
    fallback-card-title="Exercice d'entraide"
    empty-state-emoji="🎉"
    empty-state-title="Aucun exercice en souffrance !"
    empty-state-subtitle="Tout le monde est à jour, ou c'est le moment idéal pour poser ta première question."
  />
</template>