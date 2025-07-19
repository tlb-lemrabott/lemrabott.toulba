// Priority Queue System for Image Preloading
// Manages image preloading tasks with different priority levels

export interface QueueItem {
  id: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  section: string;
  description: string;
  size?: number;
  retryCount: number;
  maxRetries: number;
  addedAt: number;
  lastAttempt?: number;
}

export interface QueueStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  processing: number;
  completed: number;
  failed: number;
  pending: number;
}

export class PriorityQueue {
  private highPriorityQueue: QueueItem[] = [];
  private mediumPriorityQueue: QueueItem[] = [];
  private lowPriorityQueue: QueueItem[] = [];
  private processing: Set<string> = new Set();
  private completed: Set<string> = new Set();
  private failed: Set<string> = new Set();
  private maxConcurrent: number;
  private isProcessing: boolean = false;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  // Add item to appropriate priority queue
  enqueue(item: Omit<QueueItem, 'retryCount' | 'addedAt'>): void {
    const queueItem: QueueItem = {
      ...item,
      retryCount: 0,
      addedAt: Date.now()
    };

    switch (item.priority) {
      case 'high':
        this.highPriorityQueue.push(queueItem);
        break;
      case 'medium':
        this.mediumPriorityQueue.push(queueItem);
        break;
      case 'low':
        this.lowPriorityQueue.push(queueItem);
        break;
    }

    console.log(`[PriorityQueue] Added ${item.url} to ${item.priority} priority queue`);
  }

  // Get next item to process (highest priority first)
  dequeue(): QueueItem | null {
    // Check high priority first
    if (this.highPriorityQueue.length > 0) {
      return this.highPriorityQueue.shift() || null;
    }
    
    // Then medium priority
    if (this.mediumPriorityQueue.length > 0) {
      return this.mediumPriorityQueue.shift() || null;
    }
    
    // Finally low priority
    if (this.lowPriorityQueue.length > 0) {
      return this.lowPriorityQueue.shift() || null;
    }

    return null;
  }

  // Peek at next item without removing it
  peek(): QueueItem | null {
    if (this.highPriorityQueue.length > 0) {
      return this.highPriorityQueue[0];
    }
    if (this.mediumPriorityQueue.length > 0) {
      return this.mediumPriorityQueue[0];
    }
    if (this.lowPriorityQueue.length > 0) {
      return this.lowPriorityQueue[0];
    }
    return null;
  }

  // Mark item as processing
  markProcessing(itemId: string): void {
    this.processing.add(itemId);
  }

  // Mark item as completed
  markCompleted(itemId: string): void {
    this.processing.delete(itemId);
    this.completed.add(itemId);
  }

  // Mark item as failed and potentially retry
  markFailed(itemId: string, item: QueueItem): boolean {
    this.processing.delete(itemId);
    
    if (item.retryCount < item.maxRetries) {
      // Retry with exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, item.retryCount), 30000);
      item.retryCount++;
      item.lastAttempt = Date.now();
      
      setTimeout(() => {
        this.enqueue(item);
      }, backoffDelay);
      
      console.log(`[PriorityQueue] Retrying ${item.url} (attempt ${item.retryCount}/${item.maxRetries}) in ${backoffDelay}ms`);
      return true; // Will retry
    } else {
      // Max retries reached
      this.failed.add(itemId);
      console.warn(`[PriorityQueue] Max retries reached for ${item.url}`);
      return false; // Won't retry
    }
  }

  // Get queue statistics
  getStats(): QueueStats {
    return {
      total: this.getTotalSize(),
      high: this.highPriorityQueue.length,
      medium: this.mediumPriorityQueue.length,
      low: this.lowPriorityQueue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      pending: this.getTotalSize() - this.processing.size - this.completed.size - this.failed.size
    };
  }

  // Get total size of all queues
  getTotalSize(): number {
    return this.highPriorityQueue.length + 
           this.mediumPriorityQueue.length + 
           this.lowPriorityQueue.length;
  }

  // Check if queue is empty
  isEmpty(): boolean {
    return this.getTotalSize() === 0;
  }

  // Check if can process more items
  canProcessMore(): boolean {
    return this.processing.size < this.maxConcurrent && !this.isEmpty();
  }

  // Clear all queues
  clear(): void {
    this.highPriorityQueue = [];
    this.mediumPriorityQueue = [];
    this.lowPriorityQueue = [];
    this.processing.clear();
    this.completed.clear();
    this.failed.clear();
    console.log('[PriorityQueue] All queues cleared');
  }

  // Get items by section
  getItemsBySection(section: string): QueueItem[] {
    return [
      ...this.highPriorityQueue.filter(item => item.section === section),
      ...this.mediumPriorityQueue.filter(item => item.section === section),
      ...this.lowPriorityQueue.filter(item => item.section === section)
    ];
  }

  // Get items by priority
  getItemsByPriority(priority: 'high' | 'medium' | 'low'): QueueItem[] {
    switch (priority) {
      case 'high':
        return [...this.highPriorityQueue];
      case 'medium':
        return [...this.mediumPriorityQueue];
      case 'low':
        return [...this.lowPriorityQueue];
      default:
        return [];
    }
  }

  // Remove specific item from queue
  removeItem(itemId: string): boolean {
    const highIndex = this.highPriorityQueue.findIndex(item => item.id === itemId);
    if (highIndex !== -1) {
      this.highPriorityQueue.splice(highIndex, 1);
      return true;
    }

    const mediumIndex = this.mediumPriorityQueue.findIndex(item => item.id === itemId);
    if (mediumIndex !== -1) {
      this.mediumPriorityQueue.splice(mediumIndex, 1);
      return true;
    }

    const lowIndex = this.lowPriorityQueue.findIndex(item => item.id === itemId);
    if (lowIndex !== -1) {
      this.lowPriorityQueue.splice(lowIndex, 1);
      return true;
    }

    return false;
  }

  // Get processing status
  isItemProcessing(itemId: string): boolean {
    return this.processing.has(itemId);
  }

  isItemCompleted(itemId: string): boolean {
    return this.completed.has(itemId);
  }

  isItemFailed(itemId: string): boolean {
    return this.failed.has(itemId);
  }

  // Set processing flag
  setProcessing(processing: boolean): void {
    this.isProcessing = processing;
  }

  // Get processing flag
  getProcessing(): boolean {
    return this.isProcessing;
  }

  // Get estimated time to completion based on current processing speed
  getEstimatedTimeToCompletion(): number {
    const stats = this.getStats();
    const pending = stats.pending;
    const processing = stats.processing;
    
    if (pending === 0) return 0;
    if (processing === 0) return -1; // Unknown
    
    // Rough estimate: assume each item takes 2 seconds on average
    const avgTimePerItem = 2000;
    const effectiveConcurrency = Math.min(processing, this.maxConcurrent);
    
    return Math.ceil((pending * avgTimePerItem) / effectiveConcurrency);
  }

  // Get queue health status
  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const stats = this.getStats();
    const failureRate = stats.failed / (stats.completed + stats.failed);
    
    if (failureRate > 0.3) return 'critical';
    if (failureRate > 0.1) return 'warning';
    return 'healthy';
  }
}

// Export singleton instance
export const priorityQueue = new PriorityQueue(); 