/**
 * Frontend Event Bus System
 * Implements a publisher-subscriber pattern for Vue.js frontend
 */

type EventCallback = (payload: any) => void;

interface Subscription {
  eventType: string;
  callback: EventCallback;
  once?: boolean;
}

class EventBus {
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private onceCallbacks: Set<EventCallback> = new Set();
  private history: Array<{ eventType: string; payload: any; timestamp: number }> = [];

  /**
   * Subscribe to an event
   * @param eventType The type of event to subscribe to
   * @param callback The function to call when the event is published
   * @returns A function to unsubscribe
   */
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    const callbacks = this.subscribers.get(eventType)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  /**
   * Subscribe to an event only once
   * @param eventType The type of event to subscribe to
   * @param callback The function to call when the event is published
   */
  once(eventType: string, callback: EventCallback): void {
    this.onceCallbacks.add(callback);
    this.subscribe(eventType, callback);
  }

  /**
   * Unsubscribe from an event
   * @param eventType The type of event to unsubscribe from
   * @param callback The callback function to remove
   */
  unsubscribe(eventType: string, callback: EventCallback): void {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      this.onceCallbacks.delete(callback);

      // Clean up empty sets
      if (callbacks.size === 0) {
        this.subscribers.delete(eventType);
      }
    }
  }

  /**
   * Publish an event to all subscribers
   * @param eventType The type of event to publish
   * @param payload The data to send with the event
   */
  publish(eventType: string, payload?: any): void {
    console.log(`[EVENT_BUS] Publishing event: ${eventType}`, payload);

    // Store in history
    this.history.push({
      eventType,
      payload,
      timestamp: Date.now(),
    });

    // Limit history size to prevent memory issues
    if (this.history.length > 100) {
      this.history.shift();
    }

    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      // Create a copy to avoid issues if callbacks modify the set during iteration
      const callbacksCopy = Array.from(callbacks);

      for (const callback of callbacksCopy) {
        try {
          callback(payload);

          // If this was a 'once' callback, remove it
          if (this.onceCallbacks.has(callback)) {
            this.unsubscribe(eventType, callback);
            this.onceCallbacks.delete(callback);
          }
        } catch (error) {
          console.error(`Error in event handler for '${eventType}':`, error);
        }
      }
    }
  }

  /**
   * Get recent events from history
   * @param eventType Optional event type to filter by
   * @param limit Maximum number of events to return
   * @returns Array of recent events
   */
  getHistory(
    eventType?: string,
    limit: number = 10
  ): Array<{ eventType: string; payload: any; timestamp: number }> {
    let filtered = this.history;
    if (eventType) {
      filtered = filtered.filter((event) => event.eventType === eventType);
    }
    return filtered.slice(-limit);
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscribers.clear();
    this.onceCallbacks.clear();
    this.history = [];
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Get subscriber count for an event type
   */
  getSubscriberCount(eventType: string): number {
    const callbacks = this.subscribers.get(eventType);
    return callbacks ? callbacks.size : 0;
  }
}

// Create a singleton instance
const eventBus = new EventBus();

// Export the event bus instance and types
export { eventBus, EventBus, type EventCallback, type Subscription };

// Also export as default
export default eventBus;
