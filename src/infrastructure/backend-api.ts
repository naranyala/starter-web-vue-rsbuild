/**
 * Typed Backend API Layer
 * 
 * Provides type-safe communication with the Rust backend.
 * All backend calls go through this layer for type safety and error handling.
 */

import type {
  ApiResponse,
  SystemInfo,
  AppSettings,
  FileEntry,
  ClipboardContent,
  ProcessInfo,
  WindowAction,
} from '../types/generated';

/**
 * Typed WebUI Bridge
 */
interface TypedWebUIBridge {
  call<T>(fnName: string, data?: unknown): Promise<T>;
  isConnected(): boolean;
}

/**
 * Backend API Client with full type safety
 */
export class BackendApiClient {
  private bridge: TypedWebUIBridge;

  constructor(bridge: TypedWebUIBridge) {
    this.bridge = bridge;
  }

  /**
   * Check if backend is available
   */
  isConnected(): boolean {
    return this.bridge.isConnected();
  }

  // ==================== System Information ====================

  /**
   * Get system information (OS, CPU, memory, disk)
   */
  async getSystemInfo(): Promise<ApiResponse<SystemInfo>> {
    return this.bridge.call<ApiResponse<SystemInfo>>('getSystemInfo');
  }

  // ==================== Settings ====================

  /**
   * Get application settings
   */
  async getSettings(): Promise<ApiResponse<AppSettings>> {
    return this.bridge.call<ApiResponse<AppSettings>>('getSettings');
  }

  /**
   * Update application settings
   */
  async updateSettings(settings: AppSettings): Promise<ApiResponse<void>> {
    return this.bridge.call<ApiResponse<void>>('updateSettings', { settings });
  }

  // ==================== File Manager ====================

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<ApiResponse<FileEntry[]>> {
    return this.bridge.call<ApiResponse<FileEntry[]>>('listDirectory', { path });
  }

  // ==================== Clipboard ====================

  /**
   * Get clipboard content
   */
  async getClipboard(): Promise<ApiResponse<ClipboardContent>> {
    return this.bridge.call<ApiResponse<ClipboardContent>>('getClipboard');
  }

  /**
   * Set clipboard text
   */
  async setClipboard(text: string): Promise<ApiResponse<void>> {
    return this.bridge.call<ApiResponse<void>>('setClipboard', { text });
  }

  // ==================== Process Management ====================

  /**
   * List running processes
   */
  async listProcesses(): Promise<ApiResponse<ProcessInfo[]>> {
    return this.bridge.call<ApiResponse<ProcessInfo[]>>('listProcesses');
  }

  /**
   * Kill a process by PID
   */
  async killProcess(pid: number): Promise<ApiResponse<void>> {
    return this.bridge.call<ApiResponse<void>>('killProcess', { pid });
  }

  // ==================== Window Management ====================

  /**
   * Focus a window
   */
  async windowFocus(action: WindowAction): Promise<ApiResponse<void>> {
    return this.bridge.call<ApiResponse<void>>('windowFocus', action);
  }

  /**
   * Minimize a window
   */
  async windowMinimize(action: WindowAction): Promise<ApiResponse<void>> {
    return this.bridge.call<ApiResponse<void>>('windowMinimize', action);
  }

  /**
   * Maximize a window
   */
  async windowMaximize(action: WindowAction): Promise<ApiResponse<void>> {
    return this.bridge.call<ApiResponse<void>>('windowMaximize', action);
  }

  /**
   * Restore a window
   */
  async windowRestore(action: WindowAction): Promise<ApiResponse<void>> {
    return this.bridge.call<ApiResponse<void>>('windowRestore', action);
  }

  /**
   * Close a window
   */
  async windowClose(action: WindowAction): Promise<ApiResponse<void>> {
    return this.bridge.call<ApiResponse<void>>('windowClose', action);
  }
}

/**
 * Create a typed API client from the WebUI bridge
 */
export function createBackendApi(bridge: TypedWebUIBridge): BackendApiClient {
  return new BackendApiClient(bridge);
}

/**
 * Typed API response handler
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  onError?: (error: string) => void
): T | null {
  if (!response.success) {
    if (onError && response.error) {
      onError(response.error);
    }
    return null;
  }
  return response.data ?? null;
}
