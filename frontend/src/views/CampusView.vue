<script setup lang="ts">
import AnnonceFeedLayout from '../components/AnnonceFeedLayout.vue'
</script>

<template>
  <AnnonceFeedLayout 
    page-title="Vie du Campus"
    page-subtitle="Retrouve les événements, les fêtes, les activités associatives et les actualités de ton école."
    
    api-endpoint="campus-vie" 
    
    card-type="AnnonceBonPlan"
    fallback-card-title="Actualité Campus"
    empty-state-emoji="🏫"
    empty-state-title="Le campus est bien calme..."
    empty-state-subtitle="Aucun événement ou annonce n'a été publié pour le moment. Sois le premier !"
  />
</template>