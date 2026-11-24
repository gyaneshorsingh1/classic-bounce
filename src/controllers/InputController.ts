export interface RawInputState {
  leftPressed: boolean;
  rightPressed: boolean;
  jumpPressed: boolean;
}

export type InputSubscriber = (state: RawInputState) => void;

export type ControlType = 'left' | 'right' | 'jump';

export interface InputDiagnosticEvent {
  timestamp: number;
  type: 'press' | 'release' | 'reset';
  control: ControlType | 'all';
  pointerId: number | string;
  stateBefore: RawInputState;
  stateAfter: RawInputState;
  consumedTimestamp?: number;
  latencyMs?: number;
}

/**
 * Authoritative InputController:
 * Pure TypeScript authoritative multi-touch and pointer manager.
 * Completely decoupled from React component renders, hooks, and virtual DOM.
 *
 * Core Guarantees:
 * 1. Independent Pointer Tracking: Each control tracks an active Set of pointer IDs.
 *    Releasing one pointer never deactivates another active pointer or control.
 * 2. Instantaneous: Synchronous reads without debounce, artificial delay, or tick queuing.
 * 3. Atomic Latching: Grounded tap jumps are guaranteed to be seen by the physics simulation.
 * 4. Safe Lifecycle Resets: Unconditionally zeros all inputs on app pause, blur, or modal open.
 * 5. Comprehensive Diagnostics: Real-time latency tracking between touch events and physics frames.
 */
export class InputController {
  private leftPointers: Set<number | string> = new Set();
  private rightPointers: Set<number | string> = new Set();
  private jumpPointers: Set<number | string> = new Set();

  private latchedJump: boolean = false;
  private latchedLeft: boolean = false;
  private latchedRight: boolean = false;

  private subscribers: Set<InputSubscriber> = new Set();

  // Diagnostics & latency instrumentation
  private diagnosticsEnabled: boolean = false;
  private diagnosticEvents: InputDiagnosticEvent[] = [];
  private readonly MAX_DIAGNOSTIC_EVENTS = 200;

  /**
   * Register a press on a specific control with a unique pointer identifier.
   */
  public press(control: ControlType, pointerId: number | string = 0): void {
    const before = this.getState();

    if (control === 'left') {
      this.leftPointers.add(pointerId);
      this.latchedLeft = true;
    } else if (control === 'right') {
      this.rightPointers.add(pointerId);
      this.latchedRight = true;
    } else if (control === 'jump') {
      this.jumpPointers.add(pointerId);
      this.latchedJump = true;
    }

    const after = this.getState();

    if (this.diagnosticsEnabled) {
      this.recordDiagnostic({
        timestamp: this.now(),
        type: 'press',
        control,
        pointerId,
        stateBefore: before,
        stateAfter: after,
      });
    }

    if (this.hasStateChanged(before, after)) {
      this.notifySubscribers(after);
    }
  }

  /**
   * Register a release on a specific control for a given pointer identifier.
   */
  public release(control: ControlType, pointerId: number | string = 0): void {
    const before = this.getState();

    if (control === 'left') {
      this.leftPointers.delete(pointerId);
    } else if (control === 'right') {
      this.rightPointers.delete(pointerId);
    } else if (control === 'jump') {
      this.jumpPointers.delete(pointerId);
    }

    const after = this.getState();

    if (this.diagnosticsEnabled) {
      this.recordDiagnostic({
        timestamp: this.now(),
        type: 'release',
        control,
        pointerId,
        stateBefore: before,
        stateAfter: after,
      });
    }

    if (this.hasStateChanged(before, after)) {
      this.notifySubscribers(after);
    }
  }

  /**
   * Release a pointer from ALL controls (fail-safe for touch cancellation or unmapped gesture ends).
   */
  public releasePointer(pointerId: number | string): void {
    const before = this.getState();

    this.leftPointers.delete(pointerId);
    this.rightPointers.delete(pointerId);
    this.jumpPointers.delete(pointerId);

    const after = this.getState();

    if (this.diagnosticsEnabled && this.hasStateChanged(before, after)) {
      this.recordDiagnostic({
        timestamp: this.now(),
        type: 'release',
        control: 'all',
        pointerId,
        stateBefore: before,
        stateAfter: after,
      });
    }

    if (this.hasStateChanged(before, after)) {
      this.notifySubscribers(after);
    }
  }

  /**
   * Backward-compatible convenience setters.
   */
  public setLeft(pressed: boolean, pointerId: number | string = 'left-default'): void {
    if (pressed) {
      this.press('left', pointerId);
    } else {
      this.release('left', pointerId);
    }
  }

  public setRight(pressed: boolean, pointerId: number | string = 'right-default'): void {
    if (pressed) {
      this.press('right', pointerId);
    } else {
      this.release('right', pointerId);
    }
  }

  public setJump(pressed: boolean, pointerId: number | string = 'jump-default'): void {
    if (pressed) {
      this.press('jump', pointerId);
    } else {
      this.release('jump', pointerId);
    }
  }

  /**
   * Safely zeros all active pointers, latches, and button states.
   * Invoked on app blur, pause, modal open, or unmount.
   */
  public resetAll(): void {
    const before = this.getState();

    this.leftPointers.clear();
    this.rightPointers.clear();
    this.jumpPointers.clear();
    this.latchedLeft = false;
    this.latchedRight = false;
    this.latchedJump = false;

    const after = this.getState();

    if (this.diagnosticsEnabled && this.hasStateChanged(before, after)) {
      this.recordDiagnostic({
        timestamp: this.now(),
        type: 'reset',
        control: 'all',
        pointerId: 'all',
        stateBefore: before,
        stateAfter: after,
      });
    }

    if (this.hasStateChanged(before, after)) {
      this.notifySubscribers(after);
    }
  }

  /**
   * Instantaneous read of active button states.
   */
  public getState(): RawInputState {
    return {
      leftPressed: this.leftPointers.size > 0,
      rightPressed: this.rightPointers.size > 0,
      jumpPressed: this.jumpPointers.size > 0,
    };
  }

  /**
   * Consumed by PhysicsWorld step.
   * Incorporates latched taps to guarantee sub-frame touch registration.
   */
  public consumeStepState(): RawInputState {
    const isLeftPhysicallyHeld = this.leftPointers.size > 0;
    const isRightPhysicallyHeld = this.rightPointers.size > 0;
    const isJumpPhysicallyHeld = this.jumpPointers.size > 0;

    const state: RawInputState = {
      leftPressed: isLeftPhysicallyHeld || this.latchedLeft,
      rightPressed: isRightPhysicallyHeld || this.latchedRight,
      jumpPressed: isJumpPhysicallyHeld || this.latchedJump,
    };

    // Consume transient latches
    this.latchedLeft = false;
    this.latchedRight = false;
    this.latchedJump = false;

    // Record consumption timestamp on pending diagnostic events
    if (this.diagnosticsEnabled && this.diagnosticEvents.length > 0) {
      const now = this.now();
      for (let i = this.diagnosticEvents.length - 1; i >= 0; i--) {
        const evt = this.diagnosticEvents[i];
        if (evt.consumedTimestamp === undefined) {
          evt.consumedTimestamp = now;
          evt.latencyMs = Math.round((now - evt.timestamp) * 100) / 100;
        } else {
          break;
        }
      }
    }

    return state;
  }

  public subscribe(subscriber: InputSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notifySubscribers(state: RawInputState): void {
    if (this.subscribers.size === 0) return;
    this.subscribers.forEach((sub) => {
      try {
        sub(state);
      } catch {}
    });
  }

  private hasStateChanged(a: RawInputState, b: RawInputState): boolean {
    return (
      a.leftPressed !== b.leftPressed ||
      a.rightPressed !== b.rightPressed ||
      a.jumpPressed !== b.jumpPressed
    );
  }

  // --- Diagnostics API ---

  public enableDiagnostics(enabled: boolean): void {
    this.diagnosticsEnabled = enabled;
    if (!enabled) {
      this.diagnosticEvents = [];
    }
  }

  public isDiagnosticsEnabled(): boolean {
    return this.diagnosticsEnabled;
  }

  public getDiagnostics(): InputDiagnosticEvent[] {
    return [...this.diagnosticEvents];
  }

  public clearDiagnostics(): void {
    this.diagnosticEvents = [];
  }

  private recordDiagnostic(event: InputDiagnosticEvent): void {
    this.diagnosticEvents.push(event);
    if (this.diagnosticEvents.length > this.MAX_DIAGNOSTIC_EVENTS) {
      this.diagnosticEvents.shift();
    }
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}
