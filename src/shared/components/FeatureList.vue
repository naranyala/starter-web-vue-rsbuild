<template>
  <section class="features-list">
    <FeatureItem
      v-for="feature in features"
      :key="feature.id"
      :id="feature.id"
      :title="feature.title"
      :description="feature.description"
      :icon="feature.icon"
      :tags="feature.tags"
      @click="feature.action"
    />
  </section>
</template>

<script setup lang="ts">
import FeatureItem from './FeatureItem.vue';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
  action: () => void;
}

defineProps<{
  features: Feature[];
}>();
</script>

<style scoped>
.features-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}
</style>
