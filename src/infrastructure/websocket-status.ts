/**
 * WebUI Connection Service
 * Manages the connection state between frontend and Rust backend via WebUI
 * WebUI uses a WebSocket internally to communicate between JS and Rust
 */

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface ConnectionState {
  isAvailable: boolean;
  status: ConnectionStatus;
  lastChecked: Date | null;
  lastError: string | null;
  callCount: number;
  successfulCalls: number;
  failedCalls: number;
  lastLatency: number | null;
}

interface StatusChangeEvent {
  previous: ConnectionStatus;
  current: ConnectionStatus;
  timestamp: Date;
  error?: string;
}

// Type definition for WebUI bridge
interface WebUIBridge {
  call(fn: string, ...args: unknown[]): Promise<unknown>;
  isConnected(): boolean;
  setEventCallback(callback: (e: number) => void): void;
  event: {
    CONNECTED: number;
    DISCONNECTED: number;
  };
}

class WebUIConnectionService {
  private state: ConnectionState = {
    isAvailable: false,
    status: 'disconnected',
    lastChecked: null,
    lastError: null,
    callCount: 0,
    successfulCalls: 0,
    failedCalls: 0,
    lastLatency: null,
  };

  private listeners: Array<(state: ConnectionState) => void> = [];
  private stateChangeListeners: Array<(event: StatusChangeEvent) => void> = [];
  private stateHistory: StatusChangeEvent[] = [];
  private maxHistorySize: number = 20;
  private checkInterval: number | null = null;
  private isWebUIReady: boolean = false;
  private readyCheckInterval: number | null = null;

  constructor() {
    this.waitForWebUI();
  }

  private getWebUI(): WebUIBridge | null {
    return (window as any).webui;
  }

  private waitForWebUI(): void {
    // Check if WebUI is already available
    const checkWebUI = () => {
      const webui = this.getWebUI();
      if (webui && typeof webui.isConnected === 'function') {
        this.isWebUIReady = true;
        console.log('[WebUI] Bridge detected');

        // Setup event callback
        this.setupEventCallback();

        // Initial connection check
        this.checkConnection();

        // Start periodic monitoring
        this.startMonitoring();

        // Clear the ready check interval
        if (this.readyCheckInterval) {
          clearInterval(this.readyCheckInterval);
          this.readyCheckInterval = null;
        }
      }
    };

    // Check immediately
    checkWebUI();

    // If not ready, check every 500ms
    if (!this.isWebUIReady) {
      this.readyCheckInterval = window.setInterval(checkWebUI, 500);
    }
  }

  private setupEventCallback(): void {
    const webui = this.getWebUI();
    if (webui && typeof webui.setEventCallback === 'function') {
      webui.setEventCallback((e: number) => {
        if (e === webui.event.CONNECTED) {
          this.handleConnect();
        } else if (e === webui.event.DISCONNECTED) {
          this.handleDisconnect();
        }
      });
    }
  }

  private handleConnect(): void {
    const wasAvailable = this.state.isAvailable;
    this.state.isAvailable = true;
    this.state.status = 'connected';
    this.state.lastChecked = new Date();
    this.state.lastError = null;

    if (!wasAvailable) {
      this.recordStateChange('connected');
      this.notifyListeners();
      console.log('[WebUI] Connected to backend');
    }
  }

  private handleDisconnect(): void {
    const wasAvailable = this.state.isAvailable;
    this.state.isAvailable = false;
    this.state.status = 'disconnected';
    this.state.lastChecked = new Date();

    if (wasAvailable) {
      this.recordStateChange('disconnected');
      this.notifyListeners();
      console.log('[WebUI] Disconnected from backend');
    }
  }

  private startMonitoring(): void {
    // Periodic check every 3 seconds
    this.checkInterval = window.setInterval(() => {
      this.checkConnection();
    }, 3000);
  }

  private checkConnection(): void {
    const webui = this.getWebUI();
    const wasAvailable = this.state.isAvailable;

    if (webui && typeof webui.isConnected === 'function') {
      const isConnected = webui.isConnected();

      if (isConnected && !wasAvailable) {
        this.handleConnect();
      } else if (!isConnected && wasAvailable) {
        this.handleDisconnect();
      }
    }
  }

  private recordStateChange(newStatus: ConnectionStatus, error?: string): void {
    const event: StatusChangeEvent = {
      previous: this.state.status,
      current: newStatus,
      timestamp: new Date(),
      error,
    };

    this.stateHistory.push(event);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }

    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in state change listener:', e);
      }
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getState());
      } catch (e) {
        console.error('Error in connection listener:', e);
      }
    });
  }

  subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.getState());
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  subscribeToStateChanges(listener: (event: StatusChangeEvent) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  getStateHistory(): StatusChangeEvent[] {
    return [...this.stateHistory];
  }

  isConnected(): boolean {
    return this.state.isAvailable && this.state.status === 'connected';
  }

  /**
   * Call a Rust function via WebUI
   */
  async call<T = unknown>(funcName: string, data: unknown = {}): Promise<T> {
    this.state.callCount++;
    const startTime = performance.now();

    const webui = this.getWebUI();

    if (!webui) {
      this.state.failedCalls++;
      this.recordStateChange('error', `Cannot call ${funcName} - WebUI not available`);
      throw new Error('WebUI not available - waiting for connection');
    }

    if (!this.isConnected()) {
      this.state.failedCalls++;
      this.recordStateChange('error', `Cannot call ${funcName} - not connected`);
      throw new Error('WebUI not connected');
    }

    try {
      // Call the Rust function using WebUI API
      const result = await webui.call(funcName, data);

      // Record success
      this.state.successfulCalls++;
      this.state.lastLatency = performance.now() - startTime;

      // Result is a string, try to parse if it looks like JSON
      if (typeof result === 'string') {
        try {
          return JSON.parse(result) as T;
        } catch {
          return result as T;
        }
      }

      return result as T;
    } catch (error) {
      this.state.failedCalls++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.recordStateChange('error', errorMsg);
      throw error;
    }
  }

  /**
   * Call Rust function with retry logic
   */
  async callWithRetry<T = unknown>(
    funcName: string,
    data: unknown = {},
    options: { retries?: number; delay?: number } = {}
  ): Promise<T> {
    const maxRetries = options.retries ?? 3;
    const delay = options.delay ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.call<T>(funcName, data);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.warn(`Call to ${funcName} failed, retry ${attempt + 1}/${maxRetries}...`);
        await this.sleep(delay * 2 ** attempt);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Ping the backend to test connectivity
   */
  async ping(): Promise<{ latency: number; status: string }> {
    const startTime = performance.now();

    try {
      const result = await this.call<{ status: string; timestamp: string }>('ping', {});
      const latency = performance.now() - startTime;

      this.state.lastLatency = latency;
      return { latency, status: result?.status || 'ok' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.recordStateChange('error', `Ping failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Force a connection check
   */
  forceCheck(): void {
    this.checkConnection();
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.readyCheckInterval) {
      clearInterval(this.readyCheckInterval);
      this.readyCheckInterval = null;
    }
    this.listeners = [];
    this.stateChangeListeners = [];
  }
}

// Singleton instance
export const webuiConnection = new WebUIConnectionService();
export type { ConnectionState, StatusChangeEvent };
