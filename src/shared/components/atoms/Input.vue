<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string | number;
    label?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    type: 'text',
    disabled: false,
  }
);

defineEmits<{
  'update:modelValue': [value: string | number];
}>();
</script>

<style scoped>
.input-wrapper { display: flex; flex-direction: column; gap: 0.25rem; }
.input-label { font-size: 0.875rem; font-weight: 500; color: #374151; }
.input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 1rem;
}
.input:focus { outline: none; border-color: #3b82f6; }
.input:disabled { background: #f3f4f6; cursor: not-allowed; }
</style>
