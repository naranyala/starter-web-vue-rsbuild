/**
 * Enhanced Error Logger for Frontend
 * 
 * Provides comprehensive error logging with:
 * - Console output with stack traces
 * - Error context and metadata
 * - Network error tracking
 * - Promise rejection handling
 * - Vue component error boundaries
 */

/**
 * Error log entry structure
 */
export interface ErrorLogEntry {
  /** Unique error ID */
  id: string;
  /** Error timestamp */
  timestamp: string;
  /** Error category */
  category: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  /** Component or source */
  source?: string;
  /** Stack trace if available */
  stack?: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** URL where error occurred */
  url?: string;
  /** User agent */
  userAgent?: string;
}

/**
 * Enhanced Error Logger class
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorHistory: ErrorLogEntry[] = [];
  private maxHistorySize = 100;
  private errorCounts: Map<string, number> = new Map();
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Initialize global error handlers
   * Call this once at application startup
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.setupGlobalHandlers();
    this.logInfo('ErrorLogger initialized', {
      maxHistorySize: this.maxHistorySize,
    });
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalHandlers(): void {
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      event.preventDefault();
      this.handleGlobalError(event);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      this.handleUnhandledRejection(event);
    });

    // Handle Vue-specific errors (if using Vue)
    if (typeof window !== 'undefined') {
      (window as any).__VUE_ERROR_HANDLER__ = (
        err: unknown,
        instance: unknown,
        info: string
      ) => {
        this.handleVueError(err, instance, info);
      };
    }
  }

  /**
   * Handle global window errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    const entry = this.createLogEntry({
      category: 'runtime',
      message: event.message || 'Unknown error',
      severity: 'error',
      source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'unknown',
      stack: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorType: event.error?.constructor?.name || 'Unknown',
      },
    });

    this.logEntry(entry);
    this.incrementErrorCount(entry.category);
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unknown promise rejection';

    const entry = this.createLogEntry({
      category: 'promise-rejection',
      message,
      severity: 'error',
      source: 'Promise',
      stack: reason instanceof Error ? reason.stack : undefined,
      context: {
        rejectionType: reason?.constructor?.name || 'Unknown',
        promise: 'Promise object',
      },
    });

    this.logEntry(entry);
    this.incrementErrorCount(entry.category);
  }

  /**
   * Handle Vue component errors
   */
  private handleVueError(err: unknown, instance: unknown, info: string): void {
    const componentName =
      instance &&
      typeof instance === 'object' &&
      '$options' in instance &&
      instance.$options &&
      typeof instance.$options === 'object' &&
      instance.$options &&
      'name' in instance.$options
        ? (instance.$options as { name?: string }).name
        : 'Anonymous';

    const entry = this.createLogEntry({
      category: 'vue-component',
      message: err instanceof Error ? err.message : String(err),
      severity: 'error',
      source: componentName,
      stack: err instanceof Error ? err.stack : undefined,
      context: {
        component: componentName,
        lifecycleHook: info,
        vueInfo: info,
      },
    });

    this.logEntry(entry);
    this.incrementErrorCount(entry.category);
  }

  /**
   * Log an application error
   */
  public log(error: unknown, options: Partial<ErrorLogEntry> = {}): ErrorLogEntry {
    const entry = this.createLogEntry({
      category: options.category || 'application',
      message: this.extractMessage(error),
      severity: options.severity || 'error',
      source: options.source,
      stack: error instanceof Error ? error.stack : options.stack,
      context: options.context,
    });

    this.logEntry(entry);
    return entry;
  }

  /**
   * Log a network error
   */
  public logNetworkError(
    url: string,
    method: string,
    status?: number,
    error?: unknown
  ): ErrorLogEntry {
    const entry = this.createLogEntry({
      category: 'network',
      message: `Network error: ${method} ${url}${status ? ` (${status})` : ''}`,
      severity: 'error',
      source: 'Network',
      context: {
        url,
        method,
        status,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    this.logEntry(entry);
    this.incrementErrorCount('network');
    return entry;
  }

  /**
   * Log an API error
   */
  public logApiError(
    endpoint: string,
    method: string,
    response: Response,
    body?: unknown
  ): ErrorLogEntry {
    const entry = this.createLogEntry({
      category: 'api',
      message: `API Error: ${method} ${endpoint} - ${response.status} ${response.statusText}`,
      severity: 'error',
      source: 'API',
      context: {
        endpoint,
        method,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        responseBody: body,
      },
    });

    this.logEntry(entry);
    this.incrementErrorCount('api');
    return entry;
  }

  /**
   * Log a validation error
   */
  public logValidationError(field: string, message: string, value?: unknown): ErrorLogEntry {
    const entry = this.createLogEntry({
      category: 'validation',
      message,
      severity: 'warning',
      source: 'Validation',
      context: {
        field,
        value,
      },
    });

    this.logEntry(entry);
    return entry;
  }

  /**
   * Log an info message
   */
  public logInfo(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry({
      category: 'info',
      message,
      severity: 'info',
      context,
    });
    this.logEntry(entry, false);
  }

  /**
   * Log a warning
   */
  public logWarning(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry({
      category: 'warning',
      message,
      severity: 'warning',
      context,
    });
    this.logEntry(entry, false);
  }

  /**
   * Get error history
   */
  public getHistory(limit?: number): ErrorLogEntry[] {
    const history = [...this.errorHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get error counts by category
   */
  public getErrorCounts(): Map<string, number> {
    return new Map(this.errorCounts);
  }

  /**
   * Clear error history
   */
  public clearHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
  }

  /**
   * Export errors as JSON
   */
  public exportErrors(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalErrors: this.errorHistory.length,
        errorCounts: Object.fromEntries(this.errorCounts),
        errors: this.errorHistory,
      },
      null,
      2
    );
  }

  /**
   * Create a log entry
   */
  private createLogEntry(options: Partial<ErrorLogEntry>): ErrorLogEntry {
    return {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      category: options.category || 'unknown',
      message: options.message || 'Unknown error',
      severity: options.severity || 'error',
      source: options.source,
      stack: options.stack,
      context: options.context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  /**
   * Log an entry to console
   */
  private logEntry(entry: ErrorLogEntry, addToHistory: boolean = true): void {
    // Add to history
    if (addToHistory) {
      this.errorHistory.push(entry);
      // Limit history size
      if (this.errorHistory.length > this.maxHistorySize) {
        this.errorHistory.shift();
      }
    }

    // Console output with color coding (no timestamp for cleaner output)
    const color = this.getSeverityColor(entry.severity);
    const prefix = `[${entry.severity.toUpperCase()}]`;

    // Main error message
    console.groupCollapsed(
      `%c${prefix}%c ${entry.category}:${entry.source ? ` ${entry.source}` : ''} - ${entry.message}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit; font-weight: normal;'
    );

    // Error details
    console.log('%cID:', 'font-weight: bold;', entry.id);
    console.log('%cCategory:', 'font-weight: bold;', entry.category);
    console.log('%cSource:', 'font-weight: bold;', entry.source || 'N/A');
    console.log('%cURL:', 'font-weight: bold;', entry.url || 'N/A');

    if (entry.context) {
      console.log('%cContext:', 'font-weight: bold;', entry.context);
    }

    if (entry.stack) {
      console.log('%cStack Trace:', 'font-weight: bold; color: red;');
      console.log(entry.stack);
    }

    console.groupEnd();

    // Also log as plain text for terminal capture (no timestamp)
    console.log(
      `[ERROR_LOG] ${entry.severity} | ${entry.category} | ${entry.source || 'N/A'} | ${entry.message}`
    );
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#dc2626'; // Red
      case 'error':
        return '#ea580c'; // Orange
      case 'warning':
        return '#ca8a04'; // Yellow
      case 'info':
        return '#16a34a'; // Green
      case 'debug':
        return '#6b7280'; // Gray
      default:
        return '#000000';
    }
  }

  /**
   * Increment error count for category
   */
  private incrementErrorCount(category: string): void {
    const count = this.errorCounts.get(category) || 0;
    this.errorCounts.set(category, count + 1);
  }

  /**
   * Extract message from error
   */
  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message);
    }
    return JSON.stringify(error);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  errorLogger.initialize();
}
