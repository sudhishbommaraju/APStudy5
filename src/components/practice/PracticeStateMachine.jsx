/**
 * Practice State Machine - Explicit state management for practice generation
 */

export const PracticeState = {
  IDLE: 'idle',
  LOADING: 'loading',
  GENERATED: 'generated',
  ERROR: 'error'
};

export class PracticeStateManager {
  constructor(setState) {
    this.setState = setState;
    this.currentState = PracticeState.IDLE;
  }

  transition(newState, data = {}) {
    console.log(`[Practice State] ${this.currentState} → ${newState}`, data);
    this.currentState = newState;
    this.setState({ state: newState, ...data });
  }

  isIdle() { return this.currentState === PracticeState.IDLE; }
  isLoading() { return this.currentState === PracticeState.LOADING; }
  isGenerated() { return this.currentState === PracticeState.GENERATED; }
  isError() { return this.currentState === PracticeState.ERROR; }
}