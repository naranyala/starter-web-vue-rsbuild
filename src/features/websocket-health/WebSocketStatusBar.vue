<template>
  <div
    class="websocket-status-container"
    :class="{ 'is-expanded': isExpanded, 'is-collapsed': !isExpanded }"
  >
    <!-- Collapsed State - Tiny Bar -->
    <div
      class="status-bar-collapsed"
      :class="statusClass"
      @click="toggleExpand"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="status-dot" :class="indicatorClass"></div>
      <span class="status-text">{{ compactStatusText }}</span>
      <span v-if="showExtraInfo" class="extra-info">{{ extraInfoText }}</span>
      <button class="toggle-info-btn" @click.stop="toggleExtraInfo" title="Toggle details">
        {{ showExtraInfo ? '−' : '+' }}
      </button>
      <button class="expand-btn" @click.stop="toggleExpand">
        {{ isExpanded ? '▼' : '▲' }}
      </button>
    </div>

    <!-- Expanded State - Detailed Panel -->
    <div v-if="isExpanded" class="status-panel" :class="statusClass">
      <!-- Header -->
      <div class="panel-header">
        <div class="header-title">
          <div class="status-dot" :class="indicatorClass"></div>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <button class="collapse-btn" @click="toggleExpand">✕</button>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-switcher">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Connection Tab -->
        <div v-if="activeTab === 'connection'" class="tab-pane">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Status</div>
              <div class="stat-value" :class="statusClass">{{ status.isAvailable ? 'Online' : 'Offline' }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Latency</div>
              <div class="stat-value" :class="getLatencyClass()">
                {{ status.lastLatency ? `${Math.round(status.lastLatency)}ms` : 'N/A' }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Backend</div>
              <div class="stat-value" :class="status.isAvailable ? 'success' : 'error'">
                {{ status.isAvailable ? 'Available' : 'Unavailable' }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Last Check</div>
              <div class="stat-value">{{ formatRelativeTime(status.lastChecked) }}</div>
            </div>
          </div>

          <div class="details-section">
            <div class="section-title">Connection Details</div>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Backend Available:</span>
                <span class="detail-value" :class="status.isAvailable ? 'success' : 'error'">
                  {{ status.isAvailable ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Last Checked:</span>
                <span class="detail-value">{{ formatDate(status.lastChecked) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">WebSocket URL:</span>
                <span class="detail-value">{{ websocketUrl }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Protocol:</span>
                <span class="detail-value">WebSocket</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reconnect Attempts:</span>
                <span class="detail-value">{{ reconnectAttempts }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Connection ID:</span>
                <span class="detail-value mono">{{ connectionId }}</span>
              </div>
            </div>
          </div>

          <div class="actions-section">
            <button
              class="action-btn reconnect"
              @click="forceCheck"
              :disabled="status.isAvailable"
            >
              ↻ Check Connection
            </button>
            <button
              class="action-btn reconnect"
              @click="reconnect"
              :disabled="!status.isAvailable"
            >
              ⟳ Reconnect
            </button>
          </div>
        </div>

        <!-- Performance Tab -->
        <div v-if="activeTab === 'performance'" class="tab-pane">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total Calls</div>
              <div class="stat-value">{{ status.callCount }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Success Rate</div>
              <div class="stat-value" :class="getSuccessRateClass()">
                {{ successRate }}%
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Avg Latency</div>
              <div class="stat-value" :class="getAvgLatencyClass()">
                {{ avgLatency }}ms
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Failed</div>
              <div class="stat-value" :class="{ error: status.failedCalls > 0 }">
                {{ status.failedCalls }}
              </div>
            </div>
          </div>

          <div class="details-section">
            <div class="section-title">Call Statistics</div>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Successful Calls:</span>
                <span class="detail-value success">{{ status.successfulCalls }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Failed Calls:</span>
                <span class="detail-value" :class="{ 'error': status.failedCalls > 0 }">
                  {{ status.failedCalls }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Min Latency:</span>
                <span class="detail-value">{{ minLatency }}ms</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Max Latency:</span>
                <span class="detail-value">{{ maxLatency }}ms</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Last Latency:</span>
                <span class="detail-value">{{ status.lastLatency ? Math.round(status.lastLatency) + 'ms' : 'N/A' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Calls/minute:</span>
                <span class="detail-value">{{ callsPerMinute }}</span>
              </div>
            </div>
          </div>

          <div v-if="status.lastError" class="error-section">
            <div class="section-title">Last Error</div>
            <div class="error-message">{{ status.lastError }}</div>
          </div>
        </div>

        <!-- History Tab -->
        <div v-if="activeTab === 'history'" class="tab-pane">
          <div class="history-section">
            <div class="section-title">
              Recent State Changes
              <button class="clear-btn" @click="clearHistory">Clear</button>
            </div>
            <div class="history-list">
              <div
                v-for="(event, index) in fullHistory"
                :key="index"
                class="history-item"
              >
                <span class="history-time">{{ formatTime(event.timestamp) }}</span>
                <span class="history-arrow">→</span>
                <span class="history-state" :class="`state-${event.current}`">{{ event.current }}</span>
                <span v-if="event.previous" class="history-prev">from {{ event.previous }}</span>
                <span v-if="event.error" class="history-error" :title="event.error">⚠ {{ event.error }}</span>
              </div>
              <div v-if="fullHistory.length === 0" class="no-history">
                No state changes recorded
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="tab-pane">
          <div class="settings-section">
            <div class="section-title">Display Options</div>
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" v-model="showExtraInfo" />
                Show extra info in collapsed bar
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" v-model="autoCollapse" />
                Auto-collapse after 3 seconds
              </label>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">Connection Settings</div>
            <div class="setting-item">
              <label class="setting-label">
                WebSocket URL
              </label>
              <input type="text" class="setting-input" :value="websocketUrl" disabled />
            </div>
            <div class="setting-item">
              <label class="setting-label">
                Reconnect on disconnect
              </label>
              <span class="setting-value">Enabled</span>
            </div>
          </div>

          <div class="actions-section">
            <button class="action-btn clear" @click="resetStats">
              Reset Statistics
            </button>
            <button class="action-btn clear" @click="exportLogs">
              Export Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  type ConnectionState,
  type StatusChangeEvent,
  webuiConnection,
} from '@/infrastructure/websocket-status';

const status = ref<ConnectionState>(webuiConnection.getState());
const stateHistory = ref<StatusChangeEvent[]>([]);
const isExpanded = ref(false);
const showExtraInfo = ref(false);
const autoCollapse = ref(true);
const autoCollapseTimeout = ref<number | null>(null);
const activeTab = ref<'connection' | 'performance' | 'history' | 'settings'>('connection');

// Tab definitions
const tabs = [
  { id: 'connection', label: 'Connection', icon: '🔌' },
  { id: 'performance', label: 'Performance', icon: '⚡' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const;

// Simulated connection metadata (in real app, these would come from webuiConnection)
const websocketUrl = ref('ws://localhost:8080/ws');
const reconnectAttempts = ref(0);
const connectionId = ref('conn-' + Math.random().toString(36).substring(2, 10));
const latencyHistory = ref<number[]>([]);
const firstCallTime = ref<Date | null>(null);

let unsubscribeStatus: (() => void) | null = null;
let unsubscribeState: (() => void) | null = null;

onMounted(() => {
  // Subscribe to status changes
  unsubscribeStatus = webuiConnection.subscribe((newStatus) => {
    status.value = { ...newStatus };
    if (newStatus.lastLatency) {
      latencyHistory.value.push(newStatus.lastLatency);
      if (latencyHistory.value.length > 100) {
        latencyHistory.value.shift();
      }
    }
    if (!firstCallTime.value && newStatus.callCount > 0) {
      firstCallTime.value = new Date();
    }
  });

  // Subscribe to state changes for history
  unsubscribeState = webuiConnection.subscribeToStateChanges((event) => {
    stateHistory.value.push(event);
    if (stateHistory.value.length > 50) {
      stateHistory.value.shift();
    }
  });

  // Load initial history
  stateHistory.value = webuiConnection.getStateHistory().slice(-50);

  // Initialize first call time
  if (status.value.callCount > 0) {
    firstCallTime.value = new Date(Date.now() - 60000); // Assume 1 minute ago
  }
});

onUnmounted(() => {
  if (unsubscribeStatus) unsubscribeStatus();
  if (unsubscribeState) unsubscribeState();
  if (autoCollapseTimeout.value) {
    clearTimeout(autoCollapseTimeout.value);
  }
});

// Computed properties
const statusClass = computed(() => `status-${status.value.status}`);

const indicatorClass = computed(() => {
  return {
    'indicator-connected': status.value.status === 'connected',
    'indicator-disconnected': status.value.status === 'disconnected',
    'indicator-error': status.value.status === 'error',
  };
});

const statusText = computed(() => {
  switch (status.value.status) {
    case 'connected':
      return 'Backend Connected';
    case 'disconnected':
      return 'Backend Offline';
    case 'error':
      return 'Connection Error';
    default:
      return 'Unknown';
  }
});

const compactStatusText = computed(() => {
  switch (status.value.status) {
    case 'connected':
      return 'OK';
    case 'disconnected':
      return 'OFF';
    case 'error':
      return 'ERR';
    default:
      return '?';
  }
});

const fullHistory = computed(() => {
  return [...stateHistory.value].reverse();
});

const successRate = computed(() => {
  if (status.value.callCount === 0) return 100;
  return Math.round((status.value.successfulCalls / status.value.callCount) * 100);
});

const extraInfoText = computed(() => {
  if (status.value.status === 'connected') {
    return `| Latency: ${status.value.lastLatency ? Math.round(status.value.lastLatency) + 'ms' : 'N/A'} | Calls: ${status.value.callCount}`;
  }
  return `| Success: ${successRate.value}% | Calls: ${status.value.callCount}`;
});

// Performance metrics
const avgLatency = computed(() => {
  if (latencyHistory.value.length === 0) return 0;
  const sum = latencyHistory.value.reduce((a, b) => a + b, 0);
  return Math.round(sum / latencyHistory.value.length);
});

const minLatency = computed(() => {
  if (latencyHistory.value.length === 0) return 0;
  return Math.round(Math.min(...latencyHistory.value));
});

const maxLatency = computed(() => {
  if (latencyHistory.value.length === 0) return 0;
  return Math.round(Math.max(...latencyHistory.value));
});

const callsPerMinute = computed(() => {
  if (!firstCallTime.value || status.value.callCount === 0) return 0;
  const elapsedMinutes = (Date.now() - firstCallTime.value.getTime()) / 60000;
  if (elapsedMinutes < 1) return status.value.callCount;
  return Math.round(status.value.callCount / elapsedMinutes);
});

// Methods
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;

  if (autoCollapseTimeout.value) {
    clearTimeout(autoCollapseTimeout.value);
    autoCollapseTimeout.value = null;
  }
};

const toggleExtraInfo = () => {
  showExtraInfo.value = !showExtraInfo.value;
};

const handleMouseEnter = () => {
  if (autoCollapseTimeout.value) {
    clearTimeout(autoCollapseTimeout.value);
    autoCollapseTimeout.value = null;
  }
};

const handleMouseLeave = () => {
  if (isExpanded.value && autoCollapse.value) {
    autoCollapseTimeout.value = window.setTimeout(() => {
      isExpanded.value = false;
    }, 3000);
  }
};

const getLatencyClass = () => {
  if (!status.value.lastLatency) return '';
  if (status.value.lastLatency < 100) return 'good';
  if (status.value.lastLatency < 300) return 'warning';
  return 'error';
};

const getAvgLatencyClass = () => {
  if (avgLatency.value === 0) return '';
  if (avgLatency.value < 100) return 'good';
  if (avgLatency.value < 300) return 'warning';
  return 'error';
};

const getSuccessRateClass = () => {
  const rate = successRate.value;
  if (rate >= 90) return 'good';
  if (rate >= 70) return 'warning';
  return 'error';
};

const formatDate = (date: Date | null): string => {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(date));
};

const formatRelativeTime = (date: Date | null): string => {
  if (!date) return 'Never';
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  
  if (diff < 1000) return 'Just now';
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  return formatDate(date);
};

const forceCheck = () => {
  webuiConnection.forceCheck();
};

const reconnect = () => {
  reconnectAttempts.value++;
  webuiConnection.forceCheck();
};

const clearHistory = () => {
  stateHistory.value = [];
};

const resetStats = () => {
  latencyHistory.value = [];
  reconnectAttempts.value = 0;
  firstCallTime.value = null;
};

const exportLogs = () => {
  const logs = {
    timestamp: new Date().toISOString(),
    status: status.value,
    history: stateHistory.value,
    performance: {
      avgLatency: avgLatency.value,
      minLatency: minLatency.value,
      maxLatency: maxLatency.value,
      callsPerMinute: callsPerMinute.value,
    },
  };
  
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `websocket-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.websocket-status-container {
  position: fixed;
  bottom: 0;
  left: 200px; /* Match sidebar width to avoid overlap */
  right: 0;
  z-index: 9999;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* Collapsed State - Only visible when NOT expanded */
.status-bar-collapsed {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  height: 20px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

/* Hide collapsed bar when expanded */
.websocket-status-container.is-expanded .status-bar-collapsed {
  display: none;
}

.status-bar-collapsed:hover {
  opacity: 0.9;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  font-weight: 500;
}

.extra-info {
  font-size: 10px;
  opacity: 0.85;
  margin-left: 4px;
  white-space: nowrap;
}

.toggle-info-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 2px;
  transition: all 0.2s;
  margin-left: 4px;
}

.toggle-info-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.expand-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 8px;
  padding: 0 2px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.expand-btn:hover {
  opacity: 1;
}

/* Status Colors - Collapsed (Neutral Tones) */
.status-bar-collapsed.status-connected {
  background: linear-gradient(90deg, #475569, #334155);
  color: #e2e8f0;
}

.status-bar-collapsed.status-disconnected {
  background: linear-gradient(90deg, #64748b, #475569);
  color: #cbd5e1;
}

.status-bar-collapsed.status-error {
  background: linear-gradient(90deg, #57534e, #44403c);
  color: #fecaca;
}

/* Indicator Animations (Neutral Tones) */
.indicator-connected {
  background-color: #22d3ee;
  box-shadow: 0 0 4px #22d3ee;
}

.indicator-disconnected {
  background-color: #94a3b8;
}

.indicator-error {
  background-color: #fb7185;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Expanded Panel - Hidden by default, shown via v-if */
.status-panel {
  display: none;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: #e2e8f0;
  border-top: 2px solid;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.2s ease;
}

/* Show panel when expanded */
.websocket-status-container.is-expanded .status-panel {
  display: block;
}

/* Hide panel when collapsed */
.websocket-status-container.is-collapsed .status-panel {
  display: none;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-panel.status-connected {
  border-color: #22d3ee;
}

.status-panel.status-disconnected {
  border-color: #64748b;
}

.status-panel.status-error {
  border-color: #fb7185;
}

/* Panel Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.collapse-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: #e2e8f0;
}

/* Tab Switcher */
.tab-switcher {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px 6px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border-color: rgba(255, 255, 255, 0.1);
}

.tab-icon {
  font-size: 14px;
}

.tab-label {
  white-space: nowrap;
}

/* Tab Content */
.tab-content {
  max-height: 60vh;
  overflow-y: auto;
}

.tab-pane {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.stat-value.status-connected { color: #22d3ee; }
.stat-value.status-disconnected { color: #94a3b8; }
.stat-value.status-error { color: #fb7185; }

.stat-value.good { color: #22d3ee; }
.stat-value.warning { color: #fcd34d; }
.stat-value.error { color: #fb7185; }
.stat-value.success { color: #22d3ee; }

/* Details Section */
.details-section {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.detail-label {
  color: #64748b;
}

.detail-value {
  color: #e2e8f0;
  font-weight: 500;
}

.detail-value.error {
  color: #f87171;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-value.success {
  color: #34d399;
}

/* History Section */
.history-section {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  padding: 2px 0;
}

.history-time {
  color: #64748b;
  font-family: monospace;
  min-width: 70px;
}

.history-arrow {
  color: #475569;
}

.history-state {
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 9px;
}

.state-connected { background: rgba(34, 211, 238, 0.15); color: #22d3ee; }
.state-disconnected { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
.state-error { background: rgba(251, 113, 133, 0.15); color: #fb7185; }

.history-error {
  color: #fbbf24;
  margin-left: auto;
}

/* Actions Section */
.actions-section {
  display: flex;
  gap: 8px;
  padding: 12px;
}

.action-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.reconnect {
  background: #3b82f6;
  color: white;
}

.action-btn.reconnect:hover:not(:disabled) {
  background: #2563eb;
}

.action-btn.clear {
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.action-btn.clear:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
}

/* Settings Section */
.settings-section {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
}

.setting-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.setting-input {
  flex: 1;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 11px;
}

.setting-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-value {
  font-size: 12px;
  color: #e2e8f0;
}

/* Error Section */
.error-section {
  padding: 12px;
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.2);
  border-radius: 6px;
  margin: 12px;
}

.error-message {
  font-size: 11px;
  color: #fb7185;
  font-family: monospace;
  word-break: break-word;
}

/* Detail Grid */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Clear Button */
.clear-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #64748b;
  font-size: 10px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.2s;
  float: right;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

/* No History */
.no-history {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 12px;
  font-style: italic;
}

/* History Previous */
.history-prev {
  font-size: 10px;
  color: #64748b;
  margin-left: 4px;
}

/* Mono font */
.mono {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .status-panel {
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>