<template>
  <div class="search-container">
    <input 
      type="text" 
      id="feature-search" 
      placeholder="Search features..." 
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="search-input"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.search-container {
  padding: 0;
  background: transparent;
  border-bottom: none;
  position: relative;
  top: 0;
  z-index: 10;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-duration-fast) var(--transition-timing-default);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-focus-ring);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.15);
}
</style>
