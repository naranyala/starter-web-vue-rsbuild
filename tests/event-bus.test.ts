/**
 * Tests for event-bus module
 * Tests the publisher-subscriber pattern implementation
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { eventBus, EventBus } from '../src/infrastructure/event-bus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    // Create a fresh bus for each test
    bus = new EventBus();
  });

  test('subscribes to events', () => {
    const callback = (payload: unknown) => {};
    
    bus.subscribe('test_event', callback);
    
    expect(bus.getSubscriberCount('test_event')).toBe(1);
  });

  test('unsubscribes from events', () => {
    const callback = (payload: unknown) => {};
    
    const unsubscribe = bus.subscribe('test_event', callback);
    expect(bus.getSubscriberCount('test_event')).toBe(1);
    
    unsubscribe();
    expect(bus.getSubscriberCount('test_event')).toBe(0);
  });

  test('publishes events to subscribers', () => {
    let receivedPayload: unknown = null;
    let callCount = 0;
    
    bus.subscribe('test_event', (payload) => {
      receivedPayload = payload;
      callCount++;
    });
    
    bus.publish('test_event', { data: 'test' });
    
    expect(callCount).toBe(1);
    expect(receivedPayload).toEqual({ data: 'test' });
  });

  test('publishes to multiple subscribers', () => {
    const calls: unknown[] = [];
    
    bus.subscribe('test_event', (payload) => calls.push(payload));
    bus.subscribe('test_event', (payload) => calls.push(payload));
    bus.subscribe('test_event', (payload) => calls.push(payload));
    
    bus.publish('test_event', { value: 42 });
    
    expect(calls).toHaveLength(3);
    expect(calls).toEqual([
      { value: 42 },
      { value: 42 },
      { value: 42 },
    ]);
  });

  test('handles errors in subscribers gracefully', () => {
    let secondCalled = false;
    
    bus.subscribe('test_event', () => {
      throw new Error('Subscriber error');
    });
    
    bus.subscribe('test_event', () => {
      secondCalled = true;
    });
    
    // Should not throw
    expect(() => bus.publish('test_event', {})).not.toThrow();
    expect(secondCalled).toBe(true);
  });

  test('once() subscribes for single event', () => {
    let callCount = 0;
    
    bus.once('test_event', () => {
      callCount++;
    });
    
    bus.publish('test_event', {});
    bus.publish('test_event', {});
    
    expect(callCount).toBe(1);
  });

  test('tracks event history', () => {
    bus.publish('event1', { data: 'first' });
    bus.publish('event2', { data: 'second' });
    bus.publish('event1', { data: 'third' });
    
    const history = bus.getHistory();
    expect(history).toHaveLength(3);
    
    const event1History = bus.getHistory('event1');
    expect(event1History).toHaveLength(2);
    expect(event1History[0].payload).toEqual({ data: 'first' });
    expect(event1History[1].payload).toEqual({ data: 'third' });
  });

  test('limits history size', () => {
    // Publish more than 100 events
    for (let i = 0; i < 150; i++) {
      bus.publish('many_events', { index: i });
    }
    
    // Get full history without limit
    const history = bus.getHistory('many_events', 200);
    expect(history).toHaveLength(100); // Implementation limits to 100
    expect(history[0].payload.index).toBe(50); // First 50 were dropped
  });

  test('clears all subscriptions', () => {
    bus.subscribe('event1', () => {});
    bus.subscribe('event2', () => {});
    bus.publish('event1', {});
    
    bus.clear();
    
    expect(bus.getEventTypes()).toHaveLength(0);
    expect(bus.getHistory()).toHaveLength(0);
  });

  test('returns registered event types', () => {
    bus.subscribe('type1', () => {});
    bus.subscribe('type2', () => {});
    bus.subscribe('type3', () => {});
    
    const types = bus.getEventTypes();
    
    expect(types).toHaveLength(3);
    expect(types).toContain('type1');
    expect(types).toContain('type2');
    expect(types).toContain('type3');
  });

  test('includes timestamp in history', () => {
    const before = Date.now();
    bus.publish('timestamped', {});
    const after = Date.now();
    
    const history = bus.getHistory('timestamped');
    
    expect(history).toHaveLength(1);
    expect(history[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(history[0].timestamp).toBeLessThanOrEqual(after);
  });
});

describe('Singleton eventBus', () => {
  test('exports singleton instance', () => {
    expect(eventBus).toBeDefined();
    expect(eventBus).toBeInstanceOf(EventBus);
  });

  test('singleton maintains state', () => {
    let called = false;
    eventBus.subscribe('singleton_test', () => {
      called = true;
    });
    
    eventBus.publish('singleton_test', {});
    
    expect(called).toBe(true);
  });
});
