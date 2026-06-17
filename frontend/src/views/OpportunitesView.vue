<script setup lang="ts">
import AnnonceFeedLayout from '../components/AnnonceFeedLayout.vue'
</script>

<template>
  <AnnonceFeedLayout 
    page-title="Opportunités & Bons Plans"
    page-subtitle="Découvre les jobs étudiants, les offres d'alternance, les colocations et les réductions utiles au quotidien."
    api-endpoint="opportunites"
    card-type="AnnonceBonPlan"
    fallback-card-title="Opportunité"
    empty-state-emoji="💼"
    empty-state-title="Aucune opportunité pour le moment"
    empty-state-subtitle="Reviens plus tard pour découvrir les nouvelles offres de job, de logement ou les bons plans !"
  />
</template>