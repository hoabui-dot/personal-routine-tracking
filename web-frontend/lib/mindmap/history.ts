import { MindMapTree } from './types';

export class HistoryManager {
  private past: MindMapTree[] = [];
  private future: MindMapTree[] = [];
  private maxSize: number = 50;

  constructor(initialState: MindMapTree) {
    this.past = [initialState];
  }

  // Push new state
  push(state: MindMapTree): void {
    this.past.push(state);
    this.future = []; // Clear future on new action
    
    // Limit history size
    if (this.past.length > this.maxSize) {
      this.past.shift();
    }
  }

  // Undo
  undo(): MindMapTree | null {
    if (this.past.length <= 1) return null;
    
    const current = this.past.pop()!;
    this.future.push(current);
    
    return this.past[this.past.length - 1];
  }

  // Redo
  redo(): MindMapTree | null {
    if (this.future.length === 0) return null;
    
    const next = this.future.pop()!;
    this.past.push(next);
    
    return next;
  }

  // Check if can undo/redo
  canUndo(): boolean {
    return this.past.length > 1;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  // Get current state
  current(): MindMapTree {
    return this.past[this.past.length - 1];
  }

  // Clear history
  clear(newState: MindMapTree): void {
    this.past = [newState];
    this.future = [];
  }
}
