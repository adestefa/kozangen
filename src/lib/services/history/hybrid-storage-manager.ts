import { ServiceCall } from '@/lib/types/service';

/**
 * HybridStorageManager - Works in both server and client environments
 * Uses file storage on server, localStorage on client
 */
export class HybridStorageManager {
  private readonly STORAGE_KEY = 'kozan_service_history';
  private readonly STORAGE_FILE = 'data/service-history.json';
  
  private isServer(): boolean {
    return typeof window === 'undefined';
  }

  /**
   * Load logs from appropriate storage
   */
  loadFromStorage(): ServiceCall[] {
    if (this.isServer()) {
      return this.loadFromFileStorage();
    } else {
      return this.loadFromLocalStorage();
    }
  }

  /**
   * Save logs to appropriate storage
   */
  saveToStorage(logs: ServiceCall[]): void {
    if (this.isServer()) {
      this.saveToFileStorage(logs);
    } else {
      this.saveToLocalStorage(logs);
    }
  }

  /**
   * Server-side file storage operations
   */
  private loadFromFileStorage(): ServiceCall[] {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const filePath = path.join(process.cwd(), this.STORAGE_FILE);
      
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        const logs = parsed.map((log: ServiceCall) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        console.log(`[HYBRID STORAGE] Loaded ${logs.length} logs from file`);
        return logs;
      }
      return [];
    } catch (error) {
      console.error('[HYBRID STORAGE] Failed to load from file:', error);
      return [];
    }
  }

  private saveToFileStorage(logs: ServiceCall[]): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const filePath = path.join(process.cwd(), this.STORAGE_FILE);
      const dataDir = path.dirname(filePath);
      
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
      console.log(`[HYBRID STORAGE] Saved ${logs.length} logs to file`);
    } catch (error) {
      console.error('[HYBRID STORAGE] Failed to save to file:', error);
    }
  }

  /**
   * Client-side localStorage operations
   */
  private loadFromLocalStorage(): ServiceCall[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const logs = parsed.map((log: ServiceCall) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        console.log(`[HYBRID STORAGE] Loaded ${logs.length} logs from localStorage`);
        return logs;
      }
      return [];
    } catch (error) {
      console.error('[HYBRID STORAGE] Failed to load from localStorage:', error);
      return [];
    }
  }

  private saveToLocalStorage(logs: ServiceCall[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('[HYBRID STORAGE] Failed to save to localStorage:', error);
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
      console.log(`[HYBRID STORAGE] Removed ${removedCount} old logs (older than ${daysOld} days)`);
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
      const maxStorage = 5 * 1024; // 5MB limit
      const percentage = Math.round((sizeKB / maxStorage) * 100);
      
      return { sizeKB, percentage };
    } catch (error) {
      return { sizeKB: 0, percentage: 0 };
    }
  }

  /**
   * Maintain log limit
   */
  maintainLogLimit(logs: ServiceCall[], maxLogs: number = 1000): ServiceCall[] {
    if (logs.length > maxLogs) {
      const excess = logs.length - maxLogs;
      const trimmedLogs = logs.slice(excess);
      console.log(`[HYBRID STORAGE] Removed ${excess} oldest logs to maintain limit of ${maxLogs}`);
      return trimmedLogs;
    }
    return logs;
  }

  /**
   * Clear all storage
   */
  clearStorage(): void {
    if (this.isServer()) {
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), this.STORAGE_FILE);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[HYBRID STORAGE] Cleared file storage');
        }
      } catch (error) {
        console.error('[HYBRID STORAGE] Failed to clear file storage:', error);
      }
    } else {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[HYBRID STORAGE] Cleared localStorage');
      } catch (error) {
        console.error('[HYBRID STORAGE] Failed to clear localStorage:', error);
      }
    }
  }
}