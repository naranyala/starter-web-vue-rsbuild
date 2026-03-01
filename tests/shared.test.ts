/**
 * Tests for shared types and utilities
 * Tests type guards, helpers, and common utilities
 */

import { describe, test, expect } from 'bun:test';
import { logger } from '../src/infrastructure/logger';

describe('logger', () => {
  test('exports logger object', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('info method exists and is callable', () => {
    expect(() => logger.info('Test message')).not.toThrow();
  });

  test('warn method exists and is callable', () => {
    expect(() => logger.warn('Test warning')).not.toThrow();
  });

  test('error method exists and is callable', () => {
    expect(() => logger.error('Test error')).not.toThrow();
  });

  test('debug method exists and is callable', () => {
    expect(() => logger.debug('Test debug')).not.toThrow();
  });

  test('accepts additional arguments', () => {
    expect(() => {
      logger.info('Message with data', { key: 'value' }, [1, 2, 3]);
    }).not.toThrow();
  });
});

describe('Type utilities', () => {
  test('Result type guard works', async () => {
    const { Result } = await import('../src/infrastructure/error-types');
    const { isResult } = await import('../src/infrastructure/error-types');
    
    const success = Result.ok(42);
    const failure = Result.fail({
      category: 'internal',
      message: 'Error',
      severity: 'error',
    });
    
    expect(isResult(success)).toBe(true);
    expect(isResult(failure)).toBe(true);
    expect(isResult({})).toBe(false);
    expect(isResult(null)).toBe(false);
  });

  test('AppError type guard works', async () => {
    const { isAppError } = await import('../src/infrastructure/error-types');
    
    const error = {
      category: 'validation',
      message: 'Test error',
      severity: 'warning',
    };
    
    expect(isAppError(error)).toBe(true);
    expect(isAppError(new Error('test'))).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});

describe('Shared constants', () => {
  test('Error categories are consistent', async () => {
    const { errors } = await import('../src/infrastructure/error-types');
    
    const validationError = errors.validation('test');
    const networkError = errors.network('test');
    const notFoundError = errors.notFound('test');
    
    expect(validationError.category).toBe('validation');
    expect(networkError.category).toBe('network');
    expect(notFoundError.category).toBe('not-found');
  });

  test('Error severities are valid', async () => {
    const { errors } = await import('../src/infrastructure/error-types');
    
    const validSeverities = ['info', 'warning', 'error', 'critical'];
    
    const validationError = errors.validation('test');
    const networkError = errors.network('test');
    const internalError = errors.internal('test');
    
    expect(validSeverities).toContain(validationError.severity);
    expect(validSeverities).toContain(networkError.severity);
    expect(validSeverities).toContain(internalError.severity);
  });
});
