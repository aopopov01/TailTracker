import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { errorRecoveryService, QueuedOperation } from './ErrorRecoveryService';

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  requiresAuthentication: boolean;
  dependsOn?: string[]; // IDs of actions this depends on
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

export interface QueueConfig {
  maxQueueSize: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  criticalActionTimeout: number;
}

export interface QueueStats {
  totalActions: number;
  criticalActions: number;
  highPriorityActions: number;
  failedActions: number;
  oldestActionAge: number | null;
  queueSizeBytes: number;
}

export class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private actionQueue: OfflineAction[] = [];
  private processingQueue = false;
  private isOnline = false;
  private queueListeners: ((stats: QueueStats) => void)[] = [];
  private actionListeners: ((action: OfflineAction, status: 'queued' | 'processing' | 'completed' | 'failed') => void)[] = [];

  private readonly STORAGE_KEY = '@tailtracker:offline_queue';
  private readonly FAILED_ACTIONS_KEY = '@tailtracker:failed_actions';
  private readonly QUEUE_STATS_KEY = '@tailtracker:queue_stats';

  private readonly DEFAULT_CONFIG: QueueConfig = {
    maxQueueSize: 1000,
    maxRetryAttempts: 5,
    retryDelayMs: 2000,
    criticalActionTimeout: 300000, // 5 minutes
  };

  private config: QueueConfig;

  private constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeNetworkMonitoring();
    this.loadQueue();
  }

  public static getInstance(config?: Partial<QueueConfig>): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager(config);
    }
    return OfflineQueueManager.instance;
  }

  /**
   * Add action to offline queue
   */
  public async enqueueAction(
    type: string,
    payload: any,
    options: Partial<Pick<OfflineAction, 'priority' | 'requiresAuthentication' | 'dependsOn' | 'endpoint' | 'method'>> = {}
  ): Promise<string> {
    const action: OfflineAction = {
      id: this.generateActionId(),
      type,
      payload,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: this.config.maxRetryAttempts,
      priority: options.priority || 'medium',
      requiresAuthentication: options.requiresAuthentication || false,
      dependsOn: options.dependsOn,
      endpoint: options.endpoint,
      method: options.method || 'POST',
    };

    // Check queue size limit
    if (this.actionQueue.length >= this.config.maxQueueSize) {
      await this.cleanupOldActions();
    }

    this.actionQueue.push(action);
    this.sortQueueByPriority();

    await this.persistQueue();
    this.notifyQueueListeners();
    this.notifyActionListeners(action, 'queued');

    // Process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return action.id;
  }

  /**
   * Remove action from queue
   */
  public async removeAction(actionId: string): Promise<boolean> {
    const initialLength = this.actionQueue.length;
    this.actionQueue = this.actionQueue.filter(action => action.id !== actionId);
    
    if (this.actionQueue.length !== initialLength) {
      await this.persistQueue();
      this.notifyQueueListeners();
      return true;
    }
    
    return false;
  }

  /**
   * Get action by ID
   */
  public getAction(actionId: string): OfflineAction | undefined {
    return this.actionQueue.find(action => action.id === actionId);
  }

  /**
   * Get all actions of specific type
   */
  public getActionsByType(type: string): OfflineAction[] {
    return this.actionQueue.filter(action => action.type === type);
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): QueueStats {
    const now = Date.now();
    const totalActions = this.actionQueue.length;
    const criticalActions = this.actionQueue.filter(a => a.priority === 'critical').length;
    const highPriorityActions = this.actionQueue.filter(a => a.priority === 'high').length;
    const failedActions = this.actionQueue.filter(a => a.attempts >= a.maxAttempts).length;
    
    const oldestAction = this.actionQueue.reduce((oldest, action) => 
      !oldest || action.timestamp < oldest.timestamp ? action : oldest, 
      null as OfflineAction | null
    );
    
    const oldestActionAge = oldestAction ? now - oldestAction.timestamp : null;
    const queueSizeBytes = JSON.stringify(this.actionQueue).length;

    return {
      totalActions,
      criticalActions,
      highPriorityActions,
      failedActions,
      oldestActionAge,
      queueSizeBytes,
    };
  }

  /**
   * Clear all queued actions
   */
  public async clearQueue(): Promise<void> {
    this.actionQueue = [];
    await this.persistQueue();
    this.notifyQueueListeners();
  }

  /**
   * Clear only failed actions
   */
  public async clearFailedActions(): Promise<void> {
    this.actionQueue = this.actionQueue.filter(action => action.attempts < action.maxAttempts);
    await this.persistQueue();
    this.notifyQueueListeners();
  }

  /**
   * Retry failed actions
   */
  public async retryFailedActions(): Promise<void> {
    const failedActions = this.actionQueue.filter(action => action.attempts >= action.maxAttempts);
    
    failedActions.forEach(action => {
      action.attempts = 0; // Reset attempts
      action.timestamp = Date.now(); // Update timestamp
    });

    this.sortQueueByPriority();
    await this.persistQueue();
    
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Add queue status listener
   */
  public addQueueListener(listener: (stats: QueueStats) => void): () => void {
    this.queueListeners.push(listener);
    
    // Send initial stats
    listener(this.getQueueStats());
    
    return () => {
      const index = this.queueListeners.indexOf(listener);
      if (index > -1) {
        this.queueListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add action status listener
   */
  public addActionListener(
    listener: (action: OfflineAction, status: 'queued' | 'processing' | 'completed' | 'failed') => void
  ): () => void {
    this.actionListeners.push(listener);
    
    return () => {
      const index = this.actionListeners.indexOf(listener);
      if (index > -1) {
        this.actionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Process the queue when online
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || !this.isOnline || this.actionQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      const processableActions = this.getProcessableActions();
      
      for (const action of processableActions) {
        if (!this.isOnline) {
          break; // Stop processing if we go offline
        }

        try {
          this.notifyActionListeners(action, 'processing');
          
          await this.executeAction(action);
          
          // Remove successful action from queue
          await this.removeAction(action.id);
          this.notifyActionListeners(action, 'completed');
          
        } catch (error) {
          console.warn(`Failed to execute action ${action.id}:`, error);
          
          action.attempts++;
          
          // Check if max attempts reached
          if (action.attempts >= action.maxAttempts) {
            this.notifyActionListeners(action, 'failed');
            await this.logFailedAction(action, error);
          }
        }
      }
    } finally {
      this.processingQueue = false;
      await this.persistQueue();
      this.notifyQueueListeners();
    }
  }

  /**
   * Get actions that can be processed (no unmet dependencies)
   */
  private getProcessableActions(): OfflineAction[] {
    return this.actionQueue
      .filter(action => action.attempts < action.maxAttempts)
      .filter(action => {
        if (!action.dependsOn || action.dependsOn.length === 0) {
          return true;
        }
        
        // Check if all dependencies are completed (not in queue)
        return action.dependsOn.every(depId => 
          !this.actionQueue.some(queuedAction => queuedAction.id === depId)
        );
      })
      .sort((a, b) => this.comparePriority(a.priority, b.priority));
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: OfflineAction): Promise<any> {
    // Handle different action types
    switch (action.type) {
      case 'PET_CREATE':
        return this.executePetCreateAction(action);
      case 'PET_UPDATE':
        return this.executePetUpdateAction(action);
      case 'PET_DELETE':
        return this.executePetDeleteAction(action);
      case 'VACCINATION_CREATE':
        return this.executeVaccinationCreateAction(action);
      case 'VACCINATION_UPDATE':
        return this.executeVaccinationUpdateAction(action);
      case 'LOST_PET_REPORT':
        return this.executeLostPetReportAction(action);
      case 'LOST_PET_FOUND':
        return this.executeLostPetFoundAction(action);
      case 'IMAGE_UPLOAD':
        return this.executeImageUploadAction(action);
      case 'USER_PROFILE_UPDATE':
        return this.executeUserProfileUpdateAction(action);
      case 'CUSTOM_API_CALL':
        return this.executeCustomApiCallAction(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute pet creation action
   */
  private async executePetCreateAction(action: OfflineAction): Promise<any> {
    if (!action.endpoint) {
      action.endpoint = '/api/pets';
      action.method = 'POST';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if required
        },
        body: JSON.stringify(action.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Execute pet update action
   */
  private async executePetUpdateAction(action: OfflineAction): Promise<any> {
    const petId = action.payload.id;
    if (!action.endpoint) {
      action.endpoint = `/api/pets/${petId}`;
      action.method = 'PUT';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Execute pet deletion action
   */
  private async executePetDeleteAction(action: OfflineAction): Promise<any> {
    const petId = action.payload.id;
    if (!action.endpoint) {
      action.endpoint = `/api/pets/${petId}`;
      action.method = 'DELETE';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.status === 204 ? null : response.json();
    });
  }

  /**
   * Execute vaccination creation action
   */
  private async executeVaccinationCreateAction(action: OfflineAction): Promise<any> {
    if (!action.endpoint) {
      action.endpoint = '/api/vaccinations';
      action.method = 'POST';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Execute vaccination update action
   */
  private async executeVaccinationUpdateAction(action: OfflineAction): Promise<any> {
    const vaccinationId = action.payload.id;
    if (!action.endpoint) {
      action.endpoint = `/api/vaccinations/${vaccinationId}`;
      action.method = 'PUT';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Execute lost pet report action
   */
  private async executeLostPetReportAction(action: OfflineAction): Promise<any> {
    if (!action.endpoint) {
      action.endpoint = '/api/lost-pets/report';
      action.method = 'POST';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Execute lost pet found action
   */
  private async executeLostPetFoundAction(action: OfflineAction): Promise<any> {
    const lostPetId = action.payload.lostPetId;
    if (!action.endpoint) {
      action.endpoint = `/api/lost-pets/${lostPetId}/found`;
      action.method = 'POST';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Execute image upload action
   */
  private async executeImageUploadAction(action: OfflineAction): Promise<any> {
    if (!action.endpoint) {
      action.endpoint = '/api/images/upload';
      action.method = 'POST';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const formData = new FormData();
      formData.append('image', action.payload.imageData);
      formData.append('type', action.payload.type);
      if (action.payload.petId) {
        formData.append('petId', action.payload.petId);
      }

      const response = await fetch(action.endpoint!, {
        method: action.method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Execute user profile update action
   */
  private async executeUserProfileUpdateAction(action: OfflineAction): Promise<any> {
    if (!action.endpoint) {
      action.endpoint = '/api/user/profile';
      action.method = 'PUT';
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Execute custom API call action
   */
  private async executeCustomApiCallAction(action: OfflineAction): Promise<any> {
    if (!action.endpoint || !action.method) {
      throw new Error('Custom API call requires endpoint and method');
    }

    return errorRecoveryService.executeWithRetry(async () => {
      const response = await fetch(action.endpoint!, {
        method: action.method!,
        headers: {
          'Content-Type': 'application/json',
          ...action.payload.headers,
        },
        body: action.payload.body ? JSON.stringify(action.payload.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Process queue when connection is restored
      if (!wasOnline && this.isOnline && this.actionQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000); // Small delay to ensure stability
      }
    });
  }

  /**
   * Sort queue by priority and timestamp
   */
  private sortQueueByPriority(): void {
    this.actionQueue.sort((a, b) => {
      const priorityDiff = this.comparePriority(a.priority, b.priority);
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });
  }

  /**
   * Compare action priorities
   */
  private comparePriority(
    a: 'critical' | 'high' | 'medium' | 'low',
    b: 'critical' | 'high' | 'medium' | 'low'
  ): number {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b] - priorityOrder[a];
  }

  /**
   * Clean up old actions when queue is full
   */
  private async cleanupOldActions(): Promise<void> {
    // Remove completed actions first
    const completedActions = this.actionQueue.filter(action => action.attempts >= action.maxAttempts);
    
    if (completedActions.length > 0) {
      this.actionQueue = this.actionQueue.filter(action => action.attempts < action.maxAttempts);
      return;
    }

    // Remove oldest low-priority actions
    const lowPriorityActions = this.actionQueue
      .filter(action => action.priority === 'low')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (lowPriorityActions.length > 0) {
      const toRemove = Math.min(lowPriorityActions.length, 100);
      const idsToRemove = lowPriorityActions.slice(0, toRemove).map(action => action.id);
      this.actionQueue = this.actionQueue.filter(action => !idsToRemove.includes(action.id));
    }
  }

  /**
   * Persist queue to storage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.actionQueue));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (queueData) {
        this.actionQueue = JSON.parse(queueData);
        this.sortQueueByPriority();
        this.notifyQueueListeners();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Log failed action for debugging
   */
  private async logFailedAction(action: OfflineAction, error: any): Promise<void> {
    try {
      const failedActionsData = await AsyncStorage.getItem(this.FAILED_ACTIONS_KEY);
      const failedActions = failedActionsData ? JSON.parse(failedActionsData) : [];
      
      failedActions.push({
        ...action,
        error: error.message || 'Unknown error',
        failedAt: Date.now(),
      });

      // Keep only last 50 failed actions
      if (failedActions.length > 50) {
        failedActions.splice(0, failedActions.length - 50);
      }

      await AsyncStorage.setItem(this.FAILED_ACTIONS_KEY, JSON.stringify(failedActions));
    } catch (storageError) {
      console.error('Failed to log failed action:', storageError);
    }
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify queue listeners
   */
  private notifyQueueListeners(): void {
    const stats = this.getQueueStats();
    this.queueListeners.forEach(listener => {
      try {
        listener(stats);
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });
  }

  /**
   * Notify action listeners
   */
  private notifyActionListeners(
    action: OfflineAction,
    status: 'queued' | 'processing' | 'completed' | 'failed'
  ): void {
    this.actionListeners.forEach(listener => {
      try {
        listener(action, status);
      } catch (error) {
        console.error('Error in action listener:', error);
      }
    });
  }
}

// Export singleton instance
export const offlineQueueManager = OfflineQueueManager.getInstance();