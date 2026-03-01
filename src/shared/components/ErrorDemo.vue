<template>
  <div class="demo-container">
    <h1>Global Error Handling Demo</h1>
    <p>This page demonstrates the global error handling system with modal popups and backdrop.</p>
    
    <div class="error-buttons">
      <button @click="triggerJSError" class="error-btn js-error">Trigger JavaScript Error</button>
      <button @click="triggerAPIError" class="error-btn api-error">Simulate API Error</button>
      <button @click="triggerNetworkError" class="error-btn network-error">Simulate Network Error</button>
      <button @click="triggerPromiseError" class="error-btn promise-error">Trigger Promise Rejection</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useErrorHandling } from '@/composables/useErrorHandling';

const { showError, handleApiError, handleNetworkError } = useErrorHandling();

const triggerJSError = () => {
  console.error('Triggering JavaScript error for demonstration');
  showError(new Error('This is a demonstration JavaScript error!'), {
    title: 'JavaScript Error Demo',
    component: 'Error Demo Component',
  });
};

const triggerAPIError = async () => {
  console.error('Simulating API error for demonstration');
  // Create a mock response object
  const mockResponse = new Response(JSON.stringify({ message: 'Internal server error occurred' }), {
    status: 500,
    statusText: 'Internal Server Error',
    headers: { 'Content-Type': 'application/json' },
  });

  // We'll simulate the API error handling
  showError({ category: 'api', message: 'API request failed', severity: 'error' }, {
    title: 'API Error Demo',
    component: 'Error Demo Component',
    meta: {
      status: 500,
      url: 'https://api.example.com/data',
    },
  });
};

const triggerNetworkError = () => {
  console.error('Simulating network error for demonstration');
  handleNetworkError(new Error('Network request failed'), {
    title: 'Network Error Demo',
    component: 'Error Demo Component',
  });
};

const triggerPromiseError = () => {
  console.error('Triggering promise rejection for demonstration');
  // Simulate an unhandled promise rejection
  Promise.reject(new Error('This is a demonstration promise rejection!'));

  // Also show it in the modal
  showError({ category: 'internal', message: 'Unhandled promise rejection occurred', severity: 'error' }, {
    title: 'Promise Rejection Demo',
    component: 'Error Demo Component',
    meta: {
      type: 'promise-rejection',
    },
  });
};
</script>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #374151;
  margin-bottom: 16px;
}

.error-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.error-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.js-error {
  background-color: #dc2626;
  color: white;
}

.js-error:hover {
  background-color: #b91c1c;
  transform: translateY(-2px);
}

.api-error {
  background-color: #f59e0b;
  color: white;
}

.api-error:hover {
  background-color: #d97706;
  transform: translateY(-2px);
}

.network-error {
  background-color: #3b82f6;
  color: white;
}

.network-error:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
}

.promise-error {
  background-color: #8b5cf6;
  color: white;
}

.promise-error:hover {
  background-color: #7c3aed;
  transform: translateY(-2px);
}
</style>