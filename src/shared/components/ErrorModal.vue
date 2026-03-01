<template>
  <div v-if="isVisible" class="error-modal-overlay">
    <div class="error-modal-backdrop" @click="closeModal"></div>
    <div class="error-modal-content">
      <div class="error-modal-header">
        <h2 class="error-modal-title">
          <span class="error-icon">⚠️</span>
          {{ errorTitle }}
        </h2>
        <button 
          class="error-modal-close" 
          @click="closeModal"
          aria-label="Close error modal"
        >
          ✕
        </button>
      </div>
      
      <div class="error-modal-body">
        <div class="error-details">
          <p class="error-message">{{ errorMessage }}</p>
          <details class="error-stack" v-if="errorStack">
            <summary>Error Details</summary>
            <pre class="error-stack-content">{{ errorStack }}</pre>
          </details>
          <div class="error-meta" v-if="errorMeta">
            <p><strong>Component:</strong> {{ errorMeta.component || 'Unknown' }}</p>
            <p><strong>Time:</strong> {{ errorMeta.timestamp || new Date().toLocaleString() }}</p>
            <p><strong>URL:</strong> {{ errorMeta.url || window.location.href }}</p>
          </div>
        </div>
      </div>
      
      <div class="error-modal-footer">
        <button 
          class="error-modal-action error-modal-primary" 
          @click="retryAction"
          v-if="hasRetry"
        >
          Retry
        </button>
        <button 
          class="error-modal-action error-modal-secondary" 
          @click="closeModal"
        >
          {{ hasRetry ? 'Dismiss' : 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

// Reactive state
const isVisible = ref(false);
const errorMessage = ref('');
const errorTitle = ref('Error Occurred');
const errorStack = ref('');
const errorMeta = ref(null);
const hasRetry = ref(false);
const retryCallback = ref(null);

// Props for configuration
const props = defineProps({
  title: {
    type: String,
    default: 'Error Occurred',
  },
  message: {
    type: String,
    default: '',
  },
});

// Methods
const showError = (error: any, options: any = {}) => {
  // Extract error information
  if (error instanceof Error) {
    errorMessage.value = error.message || 'An unknown error occurred';
    errorStack.value = error.stack || '';
  } else if (typeof error === 'string') {
    errorMessage.value = error;
    errorStack.value = '';
  } else {
    errorMessage.value = error.message || JSON.stringify(error) || 'An unknown error occurred';
    errorStack.value = error.stack || '';
  }

  // Set error title
  errorTitle.value = options.title || props.title || 'Error Occurred';

  // Set error metadata
  errorMeta.value = {
    component: options.component || 'Global',
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...options.meta,
  };

  // Set retry functionality
  hasRetry.value = !!options.retry;
  retryCallback.value = options.retry;

  // Show the modal
  isVisible.value = true;
};

const closeModal = () => {
  isVisible.value = false;
  errorMessage.value = '';
  errorStack.value = '';
  errorMeta.value = null;
  hasRetry.value = false;
  retryCallback.value = null;
};

const retryAction = () => {
  if (retryCallback.value && typeof retryCallback.value === 'function') {
    retryCallback.value();
  }
  closeModal();
};

// Global error handler setup
const handleGlobalError = (event: ErrorEvent) => {
  showError(event.error, {
    title: 'Unexpected Error',
    component: 'Global Handler',
    meta: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
  });
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  showError(event.reason, {
    title: 'Unhandled Promise Rejection',
    component: 'Global Handler',
    meta: {
      type: 'Promise Rejection',
    },
  });
};

// Listen for global error events from the error handler service
const handleGlobalErrorEvent = (event: CustomEvent) => {
  const errorData = event.detail;
  showError(errorData, {
    title: errorData.title,
    component: errorData.component,
    meta: errorData.meta,
    retry: errorData.retry,
  });
};

// Vue error handler
const handleVueError = (err: Error, instance: any, info: string) => {
  showError(err, {
    title: 'Vue Component Error',
    component: instance?.$options?.name || 'Unknown Component',
    meta: {
      info: info,
      component: instance?.$options?.name || 'Unknown Component',
    },
  });
};

// Setup global error handlers
onMounted(() => {
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('global-error', handleGlobalErrorEvent as EventListener);
  // Vue's global error handler would be set in the main app
});

onUnmounted(() => {
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  window.removeEventListener('global-error', handleGlobalErrorEvent as EventListener);
});

// Expose methods to parent components
defineExpose({
  showError,
  closeModal,
});
</script>

<style scoped>
.error-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.error-modal-content {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  z-index: 10000;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.error-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #fee2e2, #fecaca);
}

.error-modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #dc2626;
}

.error-icon {
  font-size: 1.5rem;
}

.error-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #dc2626;
  transition: background-color 0.2s;
}

.error-modal-close:hover {
  background-color: rgba(220, 38, 38, 0.1);
}

.error-modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: 50vh;
}

.error-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-message {
  font-size: 1.1rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.error-stack {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

.error-stack summary {
  cursor: pointer;
  font-weight: 600;
  color: #4b5563;
  padding: 8px;
  outline: none;
}

.error-stack summary:focus {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.error-stack-content {
  background: #1f2937;
  color: #f9fafb;
  padding: 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-top: 8px;
  overflow-x: auto;
  max-height: 200px;
  white-space: pre-wrap;
}

.error-meta {
  background: #f3f4f6;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

.error-meta p {
  margin: 6px 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.error-meta strong {
  color: #1f2937;
}

.error-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.error-modal-action {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.error-modal-primary {
  background: #dc2626;
  color: white;
}

.error-modal-primary:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.error-modal-secondary {
  background: #6b7280;
  color: white;
}

.error-modal-secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

/* Responsive design */
@media (max-width: 768px) {
  .error-modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .error-modal-header,
  .error-modal-body,
  .error-modal-footer {
    padding: 16px;
  }
  
  .error-modal-footer {
    flex-direction: column;
  }
  
  .error-modal-action {
    width: 100%;
  }
}
</style>