/**
 * Test setup file for Bun test runner
 * Runs before each test file
 */

// Mock console.error for cleaner test output
const originalError = console.error;
console.error = (...args: unknown[]) => {
  // Only show errors that are not expected test output
  if (process.env.DEBUG === 'true') {
    originalError(...args);
  }
};

// Global test utilities
declare global {
  var __TEST_UTILS__: {
    mockFn: (impl?: unknown) => unknown;
    sleep: (ms: number) => Promise<void>;
  };
}

globalThis.__TEST_UTILS__ = {
  /**
   * Create a mock function
   */
  mockFn: (impl?: unknown) => {
    const mock = impl || (() => {});
    (mock as any).mock = { calls: [] as unknown[][] };
    return new Proxy(mock, {
      apply(target, thisArg, args) {
        (mock as any).mock.calls.push(args as unknown[]);
        return Reflect.apply(target, thisArg, args);
      },
    });
  },

  /**
   * Sleep utility for async tests
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Export for use in tests
export {};
