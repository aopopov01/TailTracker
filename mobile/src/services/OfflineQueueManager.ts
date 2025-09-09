/**
 * TailTracker Offline Queue Manager
 * Manages queued operations when the app is offline
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedOperation {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private queue: QueuedOperation[] = [];
  private isOnline: boolean = true;
  private isProcessing: boolean = false;

  private constructor() {
    this.initializeNetworkListener();
    this.loadQueue();
  }

  public static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager();
    }
    return OfflineQueueManager.instance;
  }

  private async initializeNetworkListener() {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected || false;

    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;

      if (!wasOnline && this.isOnline) {
        // Just came back online, process queue
        this.processQueue();
      }
    });
  }

  public async addToQueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedOp);
    await this.saveQueue();

    if (this.isOnline && !this.isProcessing) {
      this.processQueue();
    }
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const operations = [...this.queue];
      
      for (const operation of operations) {
        try {
          await this.processOperation(operation);
          // Remove successful operation from queue
          this.queue = this.queue.filter(op => op.id !== operation.id);
        } catch (error) {
          // Increment retry count
          const opIndex = this.queue.findIndex(op => op.id === operation.id);
          if (opIndex >= 0) {
            this.queue[opIndex].retryCount++;
            
            // Remove if exceeded max retries
            if (this.queue[opIndex].retryCount >= this.queue[opIndex].maxRetries) {
              this.queue.splice(opIndex, 1);
              console.error(`Operation ${operation.id} failed after ${operation.maxRetries} retries:`, error);
            }
          }
        }
      }

      await this.saveQueue();
    } finally {
      this.isProcessing = false;
    }
  }

  private async processOperation(operation: QueuedOperation): Promise<void> {
    // This is a stub - in real implementation, this would dispatch to appropriate handlers
    console.log('Processing queued operation:', operation);
    
    switch (operation.type) {
      case 'pet_update':
        // Handle pet updates
        break;
      case 'vaccination_record':
        // Handle vaccination records
        break;
      case 'health_record':
        // Handle health records
        break;
      default:
        console.warn('Unknown operation type:', operation.type);
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('@TailTracker:offline_queue');
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('@TailTracker:offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  public getQueueStatus(): { pending: number; isOnline: boolean; isProcessing: boolean } {
    return {
      pending: this.queue.length,
      isOnline: this.isOnline,
      isProcessing: this.isProcessing,
    };
  }

  public async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }
}

export default OfflineQueueManager;
export { OfflineQueueManager };