<template>
  <header class="header">
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {
    title: 'System Dashboard',
  }
);
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header h1 {
  font-size: 1.2rem;
  font-weight: 600;
}
</style>
