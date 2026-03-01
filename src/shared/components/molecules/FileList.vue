<template>
  <div class="file-list">
    <div v-for="file in files" :key="file.path" class="file-item" @click="$emit('select', file)">
      <span class="file-icon">{{ file.is_directory ? '📁' : '📄' }}</span>
      <span class="file-name">{{ file.name }}</span>
      <span class="file-size">{{ formatSize(file.size) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  is_directory: boolean;
  is_file: boolean;
}

defineProps<{
  files: FileInfo[];
}>();

defineEmits<{
  select: [file: FileInfo];
}>();

function formatSize(bytes: number): string {
  if (bytes === 0) return '-';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / k ** i).toFixed(1)) + ' ' + sizes[i];
}
</script>

<style scoped>
.file-list { border: 1px solid #e5e7eb; border-radius: 0.25rem; max-height: 300px; overflow-y: auto; }
.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
.file-item:hover { background: #f3f4f6; }
.file-icon { font-size: 1.25rem; }
.file-name { flex: 1; }
.file-size { color: #6b7280; font-size: 0.875rem; }
</style>
