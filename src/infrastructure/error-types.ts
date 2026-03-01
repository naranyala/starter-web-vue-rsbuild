/**
 * Error Types for Frontend Application
 *
 * Implements "errors as values" pattern - errors are treated as regular values
 * that can be passed around, transformed, and composed rather than thrown.
 */

/** Error severity levels */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/** Error categories for classification */
export type ErrorCategory =
  | 'validation'
  | 'network'
  | 'database'
  | 'config'
  | 'auth'
  | 'permission'
  | 'not-found'
  | 'timeout'
  | 'internal';

/** Error context information */
export interface ErrorContext {
  /** Operation that caused the error */
  operation?: string;
  /** Component where error occurred */
  component?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp */
  timestamp?: string;
}

/** Application error structure */
export interface AppError {
  /** Error category */
  category: ErrorCategory;
  /** Human-readable message */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
  /** Severity level */
  severity: ErrorSeverity;
  /** Context information */
  context?: ErrorContext;
  /** Underlying cause */
  cause?: AppError | Error;
  /** Stack trace (if available) */
  stack?: string;
}

/** Result type for explicit success/failure handling */
export type Result<T, E = AppError> = Success<T> | Failure<E>;

/** Success case */
export interface Success<T> {
  isSuccess: true;
  isFailure: false;
  value: T;
  error?: undefined;
}

/** Failure case */
export interface Failure<E = AppError> {
  isSuccess: false;
  isFailure: true;
  value?: undefined;
  error: E;
}

/** Result factory functions */
export const Result = {
  /** Create a successful result */
  ok<T>(value: T): Result<T, never> {
    return {
      isSuccess: true,
      isFailure: false,
      value,
    };
  },

  /** Create a failed result */
  fail<E extends AppError>(error: E): Result<never, E> {
    return {
      isSuccess: false,
      isFailure: true,
      error,
    };
  },

  /** Convert from Promise to Result */
  async fromPromise<T>(
    promise: Promise<T>,
    category: ErrorCategory = 'internal'
  ): Promise<Result<T>> {
    try {
      const value = await promise;
      return Result.ok(value);
    } catch (e) {
      return Result.fail(toAppError(e, category));
    }
  },

  /** Convert from Result to Promise */
  toPromise<T, E extends AppError>(result: Result<T, E>): Promise<T> {
    if (result.isSuccess) {
      return Promise.resolve(result.value);
    }
    return Promise.reject(result.error);
  },

  /** Map the success value */
  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.isSuccess) {
      return Result.ok(fn(result.value));
    }
    return result as Result<U, E>;
  },

  /** Map the error */
  mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (result.isFailure) {
      return Result.fail(fn(result.error));
    }
    return result as Result<T, F>;
  },

  /** Chain operations (flat map) */
  andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
    if (result.isSuccess) {
      return fn(result.value);
    }
    return result as Result<U, E>;
  },

  /** Recover from error */
  recover<T, E>(result: Result<T, E>, fn: (error: E) => T): Result<T, never> {
    if (result.isSuccess) {
      return result;
    }
    return Result.ok(fn(result.error));
  },

  /** Get value or default */
  getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.isSuccess ? result.value : defaultValue;
  },

  /** Get value or throw */
  unwrap<T, E>(result: Result<T, E>): T {
    if (result.isSuccess) {
      return result.value;
    }
    throw new Error(`Unwrapped error: ${result.error.message}`);
  },

  /** Get error or undefined */
  unwrapError<T, E>(result: Result<T, E>): E | undefined {
    return result.isFailure ? result.error : undefined;
  },
};

/** Either type for explicit success/failure */
export type Either<S, F> = { tag: 'left'; left: S } | { tag: 'right'; right: F };

export const Either = {
  left<S, F>(value: S): Either<S, F> {
    return { tag: 'left', left: value };
  },

  right<S, F>(value: F): Either<S, F> {
    return { tag: 'right', right: value };
  },

  map<S, F, T>(either: Either<S, F>, fn: (s: S) => T): Either<T, F> {
    if (either.tag === 'left') {
      return Either.left(fn(either.left));
    }
    return either;
  },

  mapRight<S, F, T>(either: Either<S, F>, fn: (f: F) => T): Either<S, T> {
    if (either.tag === 'right') {
      return Either.right(fn(either.right));
    }
    return either;
  },
};

/** Error builder for fluent construction */
export class ErrorBuilder {
  private error: Partial<AppError> = {};

  category(category: ErrorCategory): this {
    this.error.category = category;
    return this;
  }

  message(message: string): this {
    this.error.message = message;
    return this;
  }

  code(code: string): this {
    this.error.code = code;
    return this;
  }

  severity(severity: ErrorSeverity): this {
    this.error.severity = severity;
    return this;
  }

  context(context: ErrorContext): this {
    this.error.context = context;
    return this;
  }

  cause(cause: AppError | Error): this {
    this.error.cause = cause;
    return this;
  }

  operation(op: string): this {
    if (!this.error.context) {
      this.error.context = {};
    }
    this.error.context.operation = op;
    return this;
  }

  component(comp: string): this {
    if (!this.error.context) {
      this.error.context = {};
    }
    this.error.context.component = comp;
    return this;
  }

  metadata(meta: Record<string, unknown>): this {
    if (!this.error.context) {
      this.error.context = {};
    }
    this.error.context.metadata = meta;
    return this;
  }

  build(): AppError {
    return {
      category: this.error.category || 'internal',
      message: this.error.message || 'An error occurred',
      severity: this.error.severity || 'error',
      code: this.error.code,
      context: this.error.context,
      cause: this.error.cause,
      stack: new Error().stack,
    };
  }

  toResult(): Result<never, AppError> {
    return Result.fail(this.build());
  }
}

/** Helper functions for common error patterns */
export const errors = {
  validation: (message: string): AppError => ({
    category: 'validation',
    message,
    severity: 'warning',
  }),

  network: (message: string, cause?: Error): AppError => ({
    category: 'network',
    message,
    severity: 'error',
    cause,
  }),

  notFound: (resource: string): AppError => ({
    category: 'not-found',
    message: `${resource} not found`,
    severity: 'warning',
  }),

  permission: (action: string): AppError => ({
    category: 'permission',
    message: `Permission denied: ${action}`,
    severity: 'error',
  }),

  internal: (message: string, cause?: Error): AppError => ({
    category: 'internal',
    message,
    severity: 'error',
    cause,
  }),

  timeout: (operation: string): AppError => ({
    category: 'timeout',
    message: `Operation timed out: ${operation}`,
    severity: 'warning',
  }),
};

/** Convert unknown error to AppError */
export function toAppError(error: unknown, category: ErrorCategory = 'internal'): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      category,
      message: error.message,
      severity: 'error',
      stack: error.stack,
    };
  }

  return {
    category,
    message: String(error),
    severity: 'error',
  };
}

/** Type guard for AppError */
export function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && error !== null && 'category' in error && 'message' in error;
}

/** Type guard for Result */
export function isResult<T>(value: unknown): value is Result<T> {
  return (
    typeof value === 'object' && value !== null && ('isSuccess' in value || 'isFailure' in value)
  );
}

/** Format error for display */
export function formatError(error: AppError): string {
  let output = `[${error.category.toUpperCase()}] ${error.message}`;

  if (error.code) {
    output += ` (${error.code})`;
  }

  if (error.context?.operation) {
    output += ` [Operation: ${error.context.operation}]`;
  }

  return output;
}

/** Log error with context */
export function logError(error: AppError, logger?: (msg: string) => void): void {
  const log = logger || console.error;
  log(formatError(error));

  if (error.context?.metadata) {
    log('Context:', error.context.metadata);
  }

  if (error.cause) {
    log('Cause:', error.cause);
  }

  if (error.stack) {
    log('Stack:', error.stack);
  }
}
