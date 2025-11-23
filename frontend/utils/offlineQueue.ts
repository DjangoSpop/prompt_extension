/**
 * Offline Queue for History API
 * Retries failed requests with exponential backoff
 */

import browser from 'webextension-polyfill';
import { HistoryApiClient, CreateHistoryRequest } from '../lib/api/history';

interface QueuedRequest {
  id: string;
  type: 'create' | 'enhance';
  data: any;
  retries: number;
  timestamp: number;
  lastAttempt?: number;
}

const STORAGE_KEY = 'history_offline_queue';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000]; // ms

/**
 * Offline Queue Manager
 */
export class OfflineQueue {
  private client: HistoryApiClient;
  private processing: boolean = false;

  constructor(client: HistoryApiClient) {
    this.client = client;
    this.startBackgroundProcessor();
  }

  /**
   * Add a create request to the queue
   */
  async queueCreate(data: CreateHistoryRequest): Promise<string> {
    const request: QueuedRequest = {
      id: this.generateId(),
      type: 'create',
      data,
      retries: 0,
      timestamp: Date.now(),
    };

    await this.addToQueue(request);
    this.processQueue(); // Start processing immediately

    return request.id;
  }

  /**
   * Add an enhance request to the queue
   */
  async queueEnhance(historyId: string, data: any): Promise<string> {
    const request: QueuedRequest = {
      id: this.generateId(),
      type: 'enhance',
      data: { historyId, ...data },
      retries: 0,
      timestamp: Date.now(),
    };

    await this.addToQueue(request);
    this.processQueue();

    return request.id;
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{ pending: number; failed: number }> {
    const queue = await this.getQueue();
    const pending = queue.filter(r => r.retries < MAX_RETRIES).length;
    const failed = queue.filter(r => r.retries >= MAX_RETRIES).length;

    return { pending, failed };
  }

  /**
   * Clear failed requests
   */
  async clearFailed(): Promise<void> {
    const queue = await this.getQueue();
    const remaining = queue.filter(r => r.retries < MAX_RETRIES);
    await this.saveQueue(remaining);
  }

  // Private methods

  private async addToQueue(request: QueuedRequest): Promise<void> {
    const queue = await this.getQueue();
    queue.push(request);
    await this.saveQueue(queue);
  }

  private async getQueue(): Promise<QueuedRequest[]> {
    try {
      const result = await browser.storage.local.get(STORAGE_KEY);
      return result[STORAGE_KEY] || [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  }

  private async saveQueue(queue: QueuedRequest[]): Promise<void> {
    try {
      await browser.storage.local.set({ [STORAGE_KEY]: queue });
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    try {
      const queue = await this.getQueue();
      const now = Date.now();

      for (let i = 0; i < queue.length; i++) {
        const request = queue[i];

        // Skip if max retries reached
        if (request.retries >= MAX_RETRIES) continue;

        // Check if enough time has passed since last attempt
        const delay = RETRY_DELAYS[request.retries] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        if (request.lastAttempt && now - request.lastAttempt < delay) {
          continue;
        }

        // Attempt to process
        const success = await this.processRequest(request);

        if (success) {
          // Remove from queue
          queue.splice(i, 1);
          i--;
        } else {
          // Increment retries
          request.retries++;
          request.lastAttempt = now;
        }

        await this.saveQueue(queue);
      }
    } finally {
      this.processing = false;
    }
  }

  private async processRequest(request: QueuedRequest): Promise<boolean> {
    try {
      if (request.type === 'create') {
        await this.client.create(request.data);
        return true;
      } else if (request.type === 'enhance') {
        const { historyId, ...enhanceData } = request.data;
        await this.client.enhance(historyId, enhanceData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to process queued request:', error);
      return false;
    }
  }

  private startBackgroundProcessor(): void {
    // Process queue every minute
    setInterval(() => {
      this.processQueue();
    }, 60000);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
