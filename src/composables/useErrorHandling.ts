/**
 * Error Handling Composable for Vue.js
 *
 * Provides reactive error handling using the "errors as values" pattern.
 */

import { computed, ref } from 'vue';
import type { AppError, Result } from '../infrastructure/error-types';
import { ErrorBuilder, errors, formatError } from '../infrastructure/error-types';

export interface UseErrorHandlingOptions {
  /** Auto-dismiss errors after milliseconds */
  autoDismissMs?: number;
  /** Maximum number of errors to keep in history */
  maxHistorySize?: number;
  /** Custom error handler */
  onError?: (error: AppError) => void;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const { autoDismissMs = 5000, maxHistorySize = 10, onError } = options;

  // Current error state
  const currentError = ref<AppError | null>(null);

  // Error history
  const errorHistory = ref<AppError[]>([]);

  // Loading state
  const isLoading = ref(false);

  /**
   * Check if there's an error
   */
  const hasError = computed(() => currentError.value !== null);

  /**
   * Get error message
   */
  const errorMessage = computed(() => (currentError.value ? formatError(currentError.value) : ''));

  /**
   * Set current error
   */
  function setError(error: AppError): void {
    currentError.value = error;

    // Add to history
    errorHistory.value.unshift(error);
    if (errorHistory.value.length > maxHistorySize) {
      errorHistory.value.pop();
    }

    // Call custom handler
    onError?.(error);

    // Auto-dismiss if configured
    if (autoDismissMs > 0) {
      setTimeout(clearError, autoDismissMs);
    }
  }

  /**
   * Clear current error
   */
  function clearError(): void {
    currentError.value = null;
  }

  /**
   * Clear all errors
   */
  function clearAllErrors(): void {
    currentError.value = null;
    errorHistory.value = [];
  }

  /**
   * Handle a Result - set error if failure
   */
  function handleResult<T>(result: Result<T>): T | null {
    if (result.isFailure) {
      setError(result.error);
      return null;
    }
    return result.value;
  }

  /**
   * Handle a Result with custom error transformation
   */
  function handleResultWith<T>(
    result: Result<T>,
    transformError: (error: AppError) => AppError
  ): T | null {
    if (result.isFailure) {
      setError(transformError(result.error));
      return null;
    }
    return result.value;
  }

  /**
   * Execute async operation with error handling
   */
  async function execute<T>(
    operation: () => Promise<Result<T>>,
    options: {
      setLoading?: boolean;
      transformError?: (error: AppError) => AppError;
    } = {}
  ): Promise<T | null> {
    const { setLoading = true, transformError } = options;

    if (setLoading) {
      isLoading.value = true;
    }

    try {
      const result = await operation();

      if (result.isFailure) {
        const error = transformError ? transformError(result.error) : result.error;
        setError(error);
        return null;
      }

      return result.value;
    } finally {
      if (setLoading) {
        isLoading.value = false;
      }
    }
  }

  /**
   * Create validation error
   */
  function validationError(message: string): AppError {
    return errors.validation(message);
  }

  /**
   * Create network error
   */
  function networkError(message: string, cause?: Error): AppError {
    return errors.network(message, cause);
  }

  /**
   * Create not found error
   */
  function notFoundError(resource: string): AppError {
    return errors.notFound(resource);
  }

  /**
   * Build custom error
   */
  function buildError() {
    return new ErrorBuilder();
  }

  /**
   * Dismiss error by index from history
   */
  function dismissError(index: number): void {
    errorHistory.value.splice(index, 1);
  }

  /**
   * Retry last error
   */
  function retryLast<T>(retryFn: () => Promise<Result<T>>): Promise<T | null> {
    const lastError = errorHistory.value[0];
    if (!lastError) {
      return Promise.resolve(null);
    }

    clearError();
    return execute(retryFn);
  }

  return {
    // State
    currentError,
    errorHistory,
    isLoading,
    hasError,
    errorMessage,

    // Actions
    setError,
    clearError,
    clearAllErrors,
    handleResult,
    handleResultWith,
    execute,
    retryLast,
    dismissError,

    // Error creators
    validationError,
    networkError,
    notFoundError,
    buildError,
  };
}

/**
 * Composable for form validation errors
 */
export function useFormValidation() {
  const fieldErrors = ref<Record<string, AppError>>({});

  const hasErrors = computed(() => Object.keys(fieldErrors.value).length > 0);

  function setFieldError(field: string, message: string): void {
    fieldErrors.value[field] = errors.validation(message);
  }

  function clearFieldError(field: string): void {
    delete fieldErrors.value[field];
  }

  function clearAllFieldErrors(): void {
    fieldErrors.value = {};
  }

  function validate<T extends Record<string, unknown>>(
    data: T,
    rules: Record<keyof T, (value: unknown) => string | null>
  ): boolean {
    clearAllFieldErrors();
    let isValid = true;

    for (const [field, rule] of Object.entries(rules)) {
      const error = rule(data[field as keyof T]);
      if (error) {
        setFieldError(field, error);
        isValid = false;
      }
    }

    return isValid;
  }

  return {
    fieldErrors,
    hasErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    validate,
  };
}
