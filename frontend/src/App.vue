<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>

  <main>
    <RouterView />
  </main>
</template>