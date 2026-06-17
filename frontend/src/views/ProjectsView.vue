<script setup lang="ts">
import AnnonceFeedLayout from '../components/AnnonceFeedLayout.vue'
</script>

<template>
  <AnnonceFeedLayout 
    page-title="Projets Étudiants"
    page-subtitle="Rejoins une équipe ou partage tes idées de projets pour collaborer."
    api-endpoint="projets"
    card-type="AnnonceProjet"
    fallback-card-title="Nouveau Projet"
    empty-state-emoji="💡"
    empty-state-title="Aucun projet en cours"
    empty-state-subtitle="Tu as une idée de startup ou de hackathon ? Lance-toi et cherche tes équipiers !"
  />
</template>