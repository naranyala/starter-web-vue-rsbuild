<template>
  <div class="system-stats">
    <div class="stat">
      <span class="stat-label">CPU</span>
      <div class="stat-bar">
        <div class="stat-fill" :style="{ width: `${cpuUsage}%` }"></div>
      </div>
      <span class="stat-value">{{ cpuUsage.toFixed(1) }}%</span>
    </div>
    <div class="stat">
      <span class="stat-label">Memory</span>
      <div class="stat-bar">
        <div class="stat-fill" :style="{ width: `${memoryUsage}%` }"></div>
      </div>
      <span class="stat-value">{{ formatSize(memoryUsed) }} / {{ formatSize(memoryTotal) }}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Disk</span>
      <div class="stat-bar">
        <div class="stat-fill" :style="{ width: `${diskUsage}%` }"></div>
      </div>
      <span class="stat-value">{{ diskUsage.toFixed(1) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsage: number;
}>();

function formatSize(bytes: number): string {
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / k ** i).toFixed(1)) + ' ' + sizes[i];
}
</script>

<style scoped>
.system-stats { display: flex; flex-direction: column; gap: 1rem; }
.stat { display: flex; align-items: center; gap: 1rem; }
.stat-label { width: 60px; font-weight: 500; }
.stat-bar { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.stat-fill { height: 100%; background: #3b82f6; transition: width 0.3s; }
.stat-value { width: 120px; text-align: right; color: #6b7280; font-size: 0.875rem; }
</style>
