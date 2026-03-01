/**
 * Tests for error-types module
 * Tests the "errors as values" pattern implementation
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  Result,
  Either,
  ErrorBuilder,
  errors,
  toAppError,
  isAppError,
  formatError,
  type AppError,
} from '../src/infrastructure/error-types';

describe('Result type', () => {
  test('creates successful result with ok()', () => {
    const result = Result.ok(42);
    
    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.value).toBe(42);
    expect(result.error).toBeUndefined();
  });

  test('creates failed result with fail()', () => {
    const error: AppError = {
      category: 'validation',
      message: 'Test error',
      severity: 'error',
    };
    
    const result = Result.fail(error);
    
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.value).toBeUndefined();
    expect(result.error).toBe(error);
  });

  test('maps success value', () => {
    const result = Result.ok(5);
    const mapped = Result.map(result, x => x * 2);
    
    expect(mapped.isSuccess).toBe(true);
    expect(mapped.value).toBe(10);
  });

  test('maps error value', () => {
    const error: AppError = {
      category: 'network',
      message: 'Original error',
      severity: 'error',
    };
    const result: Result<never> = Result.fail(error);
    
    const mapped = Result.mapError(result, e => ({
      ...e,
      message: 'Transformed error',
    }));
    
    expect(mapped.isFailure).toBe(true);
    expect(mapped.error?.message).toBe('Transformed error');
  });

  test('chains operations with andThen', () => {
    const result = Result.ok(5);
    const chained = Result.andThen(result, x => Result.ok(x * 2));
    
    expect(chained.isSuccess).toBe(true);
    expect(chained.value).toBe(10);
  });

  test('recovers from error', () => {
    const error: AppError = {
      category: 'internal',
      message: 'Failed',
      severity: 'error',
    };
    const result: Result<number> = Result.fail(error);
    
    const recovered = Result.recover(result, () => 42);
    
    expect(recovered.isSuccess).toBe(true);
    expect(recovered.value).toBe(42);
  });

  test('gets value or default', () => {
    const success = Result.ok(100);
    const failure: Result<number> = Result.fail({
      category: 'internal',
      message: 'Error',
      severity: 'error',
    });
    
    expect(Result.getOrElse(success, 0)).toBe(100);
    expect(Result.getOrElse(failure, 0)).toBe(0);
  });
});

describe('Either type', () => {
  test('creates left value', () => {
    const either = Either.left<string, number>('error');
    
    expect(either.tag).toBe('left');
    expect((either as any).left).toBe('error');
  });

  test('creates right value', () => {
    const either = Either.right<string, number>(42);
    
    expect(either.tag).toBe('right');
    expect((either as any).right).toBe(42);
  });

  test('maps left value', () => {
    const either = Either.left<string, number>('hello');
    const mapped = Either.map(either, s => s.toUpperCase());
    
    expect((mapped as any).left).toBe('HELLO');
  });

  test('maps right value', () => {
    const either = Either.right<string, number>(5);
    const mapped = Either.mapRight(either, n => n * 2);
    
    expect((mapped as any).right).toBe(10);
  });
});

describe('ErrorBuilder', () => {
  test('builds error with fluent API', () => {
    const error = new ErrorBuilder()
      .category('validation')
      .message('Invalid input')
      .code('VAL001')
      .severity('warning')
      .build();
    
    expect(error.category).toBe('validation');
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VAL001');
    expect(error.severity).toBe('warning');
  });

  test('adds context to error', () => {
    const error = new ErrorBuilder()
      .category('database')
      .message('Query failed')
      .operation('SELECT * FROM users')
      .component('UserRepository')
      .build();
    
    expect(error.context?.operation).toBe('SELECT * FROM users');
    expect(error.context?.component).toBe('UserRepository');
  });

  test('adds metadata to error', () => {
    const error = new ErrorBuilder()
      .category('network')
      .message('Connection timeout')
      .metadata({ url: 'https://api.example.com', timeout: 5000 })
      .build();
    
    expect(error.context?.metadata?.url).toBe('https://api.example.com');
    expect(error.context?.metadata?.timeout).toBe(5000);
  });

  test('creates Result directly with toResult()', () => {
    const result = new ErrorBuilder()
      .category('internal')
      .message('Something went wrong')
      .toResult();
    
    expect(result.isFailure).toBe(true);
    expect(result.error?.message).toBe('Something went wrong');
  });
});

describe('error helpers', () => {
  test('creates validation error', () => {
    const error = errors.validation('Field is required');
    
    expect(error.category).toBe('validation');
    expect(error.message).toBe('Field is required');
    expect(error.severity).toBe('warning');
  });

  test('creates network error', () => {
    const cause = new Error('DNS failure');
    const error = errors.network('Failed to connect', cause);
    
    expect(error.category).toBe('network');
    expect(error.cause).toBe(cause);
    expect(error.severity).toBe('error');
  });

  test('creates not found error', () => {
    const error = errors.notFound('User');
    
    expect(error.category).toBe('not-found');
    expect(error.message).toBe('User not found');
  });

  test('creates permission error', () => {
    const error = errors.permission('delete_user');
    
    expect(error.category).toBe('permission');
    expect(error.message).toBe('Permission denied: delete_user');
  });

  test('creates timeout error', () => {
    const error = errors.timeout('fetchData');
    
    expect(error.category).toBe('timeout');
    expect(error.message).toBe('Operation timed out: fetchData');
  });
});

describe('utility functions', () => {
  test('converts Error to AppError', () => {
    const jsError = new Error('JavaScript error');
    const appError = toAppError(jsError, 'internal');
    
    expect(appError.category).toBe('internal');
    expect(appError.message).toBe('JavaScript error');
    expect(appError.severity).toBe('error');
  });

  test('converts string to AppError', () => {
    const appError = toAppError('Something went wrong', 'internal');
    
    expect(appError.message).toBe('Something went wrong');
    expect(appError.category).toBe('internal');
  });

  test('passes through AppError', () => {
    const original: AppError = {
      category: 'config',
      message: 'Config error',
      severity: 'error',
    };
    const result = toAppError(original, 'internal');
    
    expect(result).toBe(original);
  });

  test('checks if value is AppError', () => {
    const error: AppError = {
      category: 'internal',
      message: 'Test',
      severity: 'error',
    };
    
    expect(isAppError(error)).toBe(true);
    expect(isAppError(new Error('test'))).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });

  test('formats error for display', () => {
    const error: AppError = {
      category: 'validation',
      message: 'Invalid email',
      code: 'VAL002',
      severity: 'warning',
      context: { operation: 'user.create' },
    };
    
    const formatted = formatError(error);
    
    expect(formatted).toContain('[VALIDATION]');
    expect(formatted).toContain('Invalid email');
    expect(formatted).toContain('(VAL002)');
    expect(formatted).toContain('[Operation: user.create]');
  });
});
