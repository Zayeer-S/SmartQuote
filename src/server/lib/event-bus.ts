import EventEmitter from 'events';
import { AppEvent, AppEventMap } from '../realtime/event.types';

// TODO: MAKE THIS FULLY GENERIC (ITS IN LIB AFTER ALL)

/**
 * Application-wide typed event bus.
 *
 * Usage:
 *   emit:      eventBus.emit('ticket:created', payload)
 *   subscribe: eventBus.on('ticket:created', handler)
 */
class TypedEventBus extends EventEmitter {
  emit<K extends AppEvent>(event: K, payload: AppEventMap[K]): boolean {
    return super.emit(event, payload);
  }

  on<K extends AppEvent>(event: K, listener: (payload: AppEventMap[K]) => void): this {
    return super.on(event, listener);
  }

  off<K extends AppEvent>(event: K, listener: (payload: AppEventMap[K]) => void): this {
    return super.off(event, listener);
  }
}

export const eventBus = new TypedEventBus();
