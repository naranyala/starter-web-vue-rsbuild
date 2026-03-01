// webui-bridge.ts
// Typed bridge between Vue.js frontend and Rust backend via WebUI

import { type AppError, Result, toAppError } from './error-types';
import { type ConnectionState, webuiConnection } from './websocket-status';
import { errorLogger } from './error-logger';
import type { ApiResponse } from '../types/generated';

// Logger for this module
const Logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[WebUI] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WebUI] ${message}`, ...args);
    errorLogger.logWarning(message, args.length > 0 ? { args } : undefined);
  },
  error: (message: string, error: unknown, context?: Record<string, unknown>) => {
    console.error(`[WebUI] ${message}`, error);
    errorLogger.log(error, {
      category: 'webui-bridge',
      severity: 'error',
      source: 'WebUIBridge',
      message,
      context,
    });
  },
  debug: (message: string, ...args: unknown[]) => console.debug(`[WebUI] ${message}`, ...args),
};

/**
 * WebUI Bridge with typed responses
 */
class WebUIBridge {
  private logger = Logger;

  constructor() {
    // Subscribe to connection state changes
    webuiConnection.subscribe((state: ConnectionState) => {
      if (state.isAvailable) {
        this.logger.info(`Backend connected (calls: ${state.successfulCalls}/${state.callCount})`);
      } else {
        this.logger.warn('Backend disconnected');
      }
    });
  }

  /**
   * Wait for bridge to be ready
   */
  async ready(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Check if backend is available
   */
  isAvailable(): boolean {
    return webuiConnection.isConnected();
  }

  /**
   * Call a Rust function with typed API response
   */
  async call<T>(funcName: string, data: unknown = {}): Promise<ApiResponse<T>> {
    this.logger.debug(`Calling: ${funcName}`, data);

    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Backend not available',
      };
    }

    try {
      const result = await webuiConnection.call(funcName, data);
      this.logger.debug(`Result from ${funcName}:`, result);
      
      // Cast to ApiResponse<T> - the backend should always return this structure
      return result as ApiResponse<T>;
    } catch (error) {
      this.logger.error(`Error calling ${funcName}:`, error, { operation: funcName });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Call with automatic retry on failure
   */
  async callWithRetry<T>(
    funcName: string,
    data: unknown = {},
    options: { retries?: number; delay?: number } = {}
  ): Promise<ApiResponse<T>> {
    const { retries = 3, delay = 100 } = options;
    
    for (let i = 0; i < retries; i++) {
      const result = await this.call<T>(funcName, data);
      if (result.success) {
        return result;
      }
      
      if (i < retries - 1) {
        this.logger.warn(`Retry ${i + 1}/${retries} for ${funcName}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: `Failed after ${retries} retries`,
    };
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionState {
    return webuiConnection.getState();
  }

  /**
   * Subscribe to connection state changes
   */
  onStatusChange(callback: (state: ConnectionState) => void): () => void {
    return webuiConnection.subscribe(callback);
  }

  // ==================== Typed Convenience Methods ====================

  async ping(): Promise<{ latency: number; status: string }> {
    const start = Date.now();
    const result = await this.call<{ status: string }>('ping');
    const latency = Date.now() - start;
    
    if (result.success && result.data) {
      return { latency, status: result.data.status };
    }
    return { latency, status: 'error' };
  }

  async getSystemInfo() {
    return this.call('getSystemInfo');
  }

  async listDirectory(path: string) {
    return this.call('listDirectory', { path });
  }

  async getSettings() {
    return this.call('getSettings');
  }

  async updateSettings(settings: unknown) {
    return this.call('updateSettings', { settings });
  }

  async getClipboard() {
    return this.call('getClipboard');
  }

  async setClipboard(text: string) {
    return this.call('setClipboard', { text });
  }

  async showMessageDialog(title: string, message: string) {
    return this.call('showMessageDialog', { title, message });
  }

  async showOpenFileDialog() {
    return this.call('showOpenFileDialog');
  }

  async listProcesses() {
    return this.call('listProcesses');
  }

  async killProcess(pid: number) {
    return this.call('killProcess', { pid });
  }

  async checkForUpdates() {
    return this.call('checkForUpdates');
  }

  async downloadUpdate() {
    return this.call('downloadUpdate');
  }

  // Window management
  async windowFocus(data: { window_id: string; window_title: string }) {
    return this.call('windowFocus', data);
  }

  async windowMinimize(data: { window_id: string; window_title: string }) {
    return this.call('windowMinimize', data);
  }

  async windowRestore(data: { window_id: string; window_title: string }) {
    return this.call('windowRestore', data);
  }

  async windowMaximize(data: { window_id: string; window_title: string }) {
    return this.call('windowMaximize', data);
  }

  async windowClose(data: { window_id: string; window_title: string }) {
    return this.call('windowClose', data);
  }
}

// Create global instance
const bridge = new WebUIBridge();

// Export
export default bridge;
export { WebUIBridge };
