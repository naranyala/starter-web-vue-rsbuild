import { createApp } from 'vue';
import { errorHandler } from './infrastructure/ErrorHandler';
import { errorLogger } from './infrastructure/error-logger';
import App from './views/App.vue';
import './infrastructure/webui-bridge';
import './styles/index.css';

const app = createApp(App);

// Set up global error handling with enhanced logging
app.config.errorHandler = (err, instance, info) => {
  const componentName = instance?.$options?.name || 'Unknown Component';
  
  // Log to enhanced error logger (exposes to terminal)
  errorLogger.log(err, {
    category: 'vue-component',
    severity: 'error',
    source: componentName,
    context: {
      info,
      component: componentName,
    },
  });

  // Also use existing error handler for UI display
  errorHandler.handleError(err, {
    title: 'Vue Component Error',
    component: componentName,
    meta: {
      info,
      component: componentName,
    },
    show: true,
  });
};

app.mount('#app');

// Log application initialization
errorLogger.logInfo('Application initialized with enhanced error logging', {
  vueVersion: app.version || '3.x',
  timestamp: new Date().toISOString(),
});

console.log('✅ Application initialized with enhanced error logging');
console.log('📋 Error logger active - all errors will be logged to terminal');
