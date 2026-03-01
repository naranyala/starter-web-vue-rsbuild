// services/ErrorHandler.ts
// Global error handling service for the application

interface ErrorOptions {
  title?: string;
  component?: string;
  meta?: Record<string, any>;
  retry?: () => void;
  show?: boolean;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorModal: HTMLElement | null = null;
  private isVisible: boolean = false;

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalHandlers(): void {
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        title: 'Unexpected Error',
        component: 'Global Handler',
        meta: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          url: window.location.href,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        title: 'Unhandled Promise Rejection',
        component: 'Global Handler',
        meta: {
          type: 'Promise Rejection',
          promise: event.promise,
        },
      });
    });
  }

  public handleError(error: any, options: ErrorOptions = {}): void {
    console.error('Global Error Handler:', error);

    // Prepare error data
    const errorData = this.prepareErrorData(error, options);

    // Show error modal if requested
    if (options.show !== false) {
      this.showErrorModal(errorData);
    }

    // Log to console for debugging
    this.logError(errorData);

    // Optionally send to error reporting service
    this.reportError(errorData);
  }

  private prepareErrorData(error: any, options: ErrorOptions): any {
    let message = '';
    let stack = '';

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack || '';
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = error.message || JSON.stringify(error, null, 2) || 'Unknown error';
    }

    return {
      message,
      stack,
      title: options.title || 'Error Occurred',
      component: options.component || 'Unknown',
      meta: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...options.meta,
      },
      retry: options.retry,
    };
  }

  private showErrorModal(errorData: any): void {
    // Emit a custom event that the Vue component can listen to
    const event = new CustomEvent('global-error', {
      detail: errorData,
    });
    window.dispatchEvent(event);
  }

  private logError(errorData: any): void {
    console.group(`%c${errorData.title}`, 'color: #dc2626; font-weight: bold;');
    console.error(errorData.message);
    if (errorData.stack) {
      console.error('Stack trace:', errorData.stack);
    }
    console.groupEnd();
  }

  private reportError(errorData: any): void {
    // In a real application, you would send this to an error reporting service
    // For example: Sentry, Bugsnag, etc.
    console.log('Error reported to service:', {
      message: errorData.message,
      component: errorData.component,
      timestamp: errorData.meta.timestamp,
      url: errorData.meta.url,
    });
  }

  // Method to handle API errors specifically
  public handleApiError(response: Response, options: ErrorOptions = {}): Promise<void> {
    return response
      .json()
      .then((data) => {
        this.handleError(new Error(data.message || `API Error: ${response.status}`), {
          title: options.title || 'API Request Failed',
          component: options.component || 'API Handler',
          meta: {
            status: response.status,
            url: response.url,
            ...options.meta,
          },
        });
      })
      .catch(() => {
        // If response is not JSON, create a generic error
        this.handleError(new Error(`API Error: ${response.status}`), {
          title: options.title || 'API Request Failed',
          component: options.component || 'API Handler',
          meta: {
            status: response.status,
            url: response.url,
            ...options.meta,
          },
        });
      });
  }

  // Method to handle network errors
  public handleNetworkError(error: any, options: ErrorOptions = {}): void {
    this.handleError(error, {
      title: options.title || 'Network Error',
      component: options.component || 'Network Handler',
      meta: {
        type: 'network',
        ...options.meta,
      },
    });
  }
}

// Create and export the singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Export the class for direct use if needed
export default ErrorHandler;
