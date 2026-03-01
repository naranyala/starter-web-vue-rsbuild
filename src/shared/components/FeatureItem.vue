<template>
  <div class="feature-item" @click="$emit('click')">
    <div class="feature-icon">{{ icon }}</div>
    <div class="feature-content">
      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
      <div class="feature-tags">
        <span 
          v-for="tag in tags" 
          :key="tag" 
          class="tag"
        >{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #e5e7eb;
}

.feature-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.feature-icon {
  font-size: 2rem;
  min-width: 3rem;
  text-align: center;
}

.feature-content {
  flex: 1;
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.feature-description {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.feature-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
