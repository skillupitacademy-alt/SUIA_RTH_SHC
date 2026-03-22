/**
 * Phase 5: Hyper-Scale Client-Side Resilience
 * This manager ensures that user answers are never lost even during 
 * network instability and prevents thundering herds on the backend.
 */

import { clientLogger } from "@/utils/clientLogger";

export interface PendingAnswer {
  examId: string;
  questionId: string;
  answer: string;
  idempotencyKey: string;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'QuizSyncDB';
const STORE_NAME = 'pending_answers';

export class SyncManager {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(DB_NAME, 2);
      openRequest.onupgradeneeded = () => {
        const db = openRequest.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'idempotencyKey' });
        }
      };
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error);
    });
    return this.dbPromise;
  }

  static async saveAnswer(answer: Omit<PendingAnswer, 'timestamp' | 'retryCount'>) {
    const db = await this.getDB();
    const item: PendingAnswer = {
      ...answer,
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  static async getPending(): Promise<PendingAnswer[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async removeAnswer(idempotencyKey: string) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(idempotencyKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Calculates the next backoff with jitter
   */
  static getBackoff(retryCount: number): number {
    const base = 1000; // 1s
    const max = 30000; // 30s
    const exponent = Math.pow(2, retryCount);
    const delay = Math.min(base * exponent, max);
    return delay + Math.random() * 1000; // Add jitter
  }

  static async syncAll(submitFn: (answer: PendingAnswer) => Promise<unknown>) {
    const pending = await this.getPending();
    if (pending.length === 0) return;

    for (const item of pending) {
        try {
            await submitFn(item);
            await this.removeAnswer(idempotencyKeyToKey(item.idempotencyKey));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            const status = (err as Record<string, unknown>)?.status;
            
            clientLogger.error('[SyncManager] Failed to sync answer', { error: message, status });

            // Terminal errors (400) should NOT be retried (Task 125).
            // This prevents "Thundering Herd" logs when an exam is closed/timed out.
            const isTerminal = status === 400 || 
                             message.includes('Time limit exceeded') || 
                             message.includes('Exam not active') ||
                             message.includes('Exam already completed');

            if (isTerminal) {
                clientLogger.warn('[SyncManager] Terminal error detected. Clearing from queue.', { key: item.idempotencyKey });
                await this.removeAnswer(idempotencyKeyToKey(item.idempotencyKey));
                continue;
            }

            // Increment retry count for transient errors (network, 500s)
            const db = await this.getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            item.retryCount++;
            tx.objectStore(STORE_NAME).put(item);
        }
    }
  }
}

function idempotencyKeyToKey(key: string): string {
    return key;
}
