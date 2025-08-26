import { ServiceCall } from '@/lib/types/service';

/**
 * StorageManager - Handles persistence of service call logs
 * Separated from main logger for better maintainability
 */
export class StorageManager {
  private readonly STORAGE_KEY = 'kozan_service_history';

  /**
   * Load logs from localStorage
   */
  loadFromStorage(): ServiceCall[] {
    try {
      if (typeof window === 'undefined') return []; // SSR safety
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const logs = parsed.map((log: ServiceCall) => ({
          ...log,
          timestamp: new Date(log.timestamp) // Convert ISO string back to Date
        }));
        console.log(`[STORAGE] Loaded ${logs.length} logs from storage`);
        return logs;
      }
      return [];
    } catch (error) {
      console.error('[STORAGE] Failed to load from storage:', error);
      return [];
    }
  }

  /**
   * Save logs to localStorage with quota management
   */
  saveToStorage(logs: ServiceCall[]): void {
    try {
      if (typeof window === 'undefined') return; // SSR safety
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('[STORAGE] Failed to save to storage:', error);
      
      // If storage is full, try clearing old logs and save again
      if (error.name === 'QuotaExceededError') {
        const cleanedLogs = this.clearOldLogs(logs, 1); // Clear logs older than 1 day
        if (cleanedLogs.length < logs.length) {
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedLogs));
          } catch (retryError) {
            console.error('[STORAGE] Still failed to save after clearing old logs:', retryError);
          }
        }
      }
    }
  }

  /**
   * Clear logs older than specified days
   */
  clearOldLogs(logs: ServiceCall[], daysOld: number = 7): ServiceCall[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const cleanedLogs = logs.filter(log => log.timestamp >= cutoffDate);
    const removedCount = logs.length - cleanedLogs.length;
    
    if (removedCount > 0) {
      console.log(`[STORAGE] Removed ${removedCount} old logs (older than ${daysOld} days)`);
    }
    
    return cleanedLogs;
  }

  /**
   * Get storage usage information
   */
  getStorageUsage(logs: ServiceCall[]): { sizeKB: number; percentage: number } {
    try {
      const data = JSON.stringify(logs);
      const sizeBytes = new Blob([data]).size;
      const sizeKB = Math.round(sizeBytes / 1024);
      const maxStorage = 5 * 1024; // Assume 5MB localStorage limit
      const percentage = Math.round((sizeKB / maxStorage) * 100);
      
      return { sizeKB, percentage };
    } catch (error) {
      return { sizeKB: 0, percentage: 0 };
    }
  }

  /**
   * Maintain log limit to prevent memory issues
   */
  maintainLogLimit(logs: ServiceCall[], maxLogs: number = 1000): ServiceCall[] {
    if (logs.length > maxLogs) {
      const excess = logs.length - maxLogs;
      const trimmedLogs = logs.slice(excess); // Remove oldest logs
      console.log(`[STORAGE] Removed ${excess} oldest logs to maintain limit of ${maxLogs}`);
      return trimmedLogs;
    }
    return logs;
  }

  /**
   * Clear all storage
   */
  clearStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[STORAGE] Cleared all stored logs');
    } catch (error) {
      console.error('[STORAGE] Failed to clear storage:', error);
    }
  }
}