<template>
  <button :class="['btn', `btn-${variant}`, { 'btn-disabled': disabled }]" :disabled="disabled" @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    disabled?: boolean;
  }>(),
  {
    variant: 'primary',
    disabled: false,
  }
);

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<style scoped>
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary { background: #3b82f6; color: white; }
.btn-secondary { background: #6b7280; color: white; }
.btn-danger { background: #ef4444; color: white; }
.btn-success { background: #10b981; color: white; }

.btn:hover:not(.btn-disabled) { opacity: 0.9; }
.btn-disabled { opacity: 0.5; cursor: not-allowed; }
</style>
