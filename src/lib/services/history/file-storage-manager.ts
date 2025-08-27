import { ServiceCall } from '@/lib/types/service';
import fs from 'fs';
import path from 'path';

/**
 * FileStorageManager - Server-side file-based storage for service call logs
 * Replaces localStorage dependency to enable server-side logging
 */
export class FileStorageManager {
  private readonly STORAGE_FILE: string;

  constructor() {
    // Store in data directory with other persistent files
    const dataDir = path.join(process.cwd(), 'data');
    this.STORAGE_FILE = path.join(dataDir, 'service-history.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Load logs from file storage
   */
  loadFromStorage(): ServiceCall[] {
    try {
      if (fs.existsSync(this.STORAGE_FILE)) {
        const data = fs.readFileSync(this.STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(data);
        const logs = parsed.map((log: ServiceCall) => ({
          ...log,
          timestamp: new Date(log.timestamp) // Convert ISO string back to Date
        }));
        console.log(`[FILE STORAGE] Loaded ${logs.length} logs from ${this.STORAGE_FILE}`);
        return logs;
      }
      return [];
    } catch (error) {
      console.error('[FILE STORAGE] Failed to load from storage:', error);
      return [];
    }
  }

  /**
   * Save logs to file storage
   */
  saveToStorage(logs: ServiceCall[]): void {
    try {
      fs.writeFileSync(this.STORAGE_FILE, JSON.stringify(logs, null, 2));
      console.log(`[FILE STORAGE] Saved ${logs.length} logs to ${this.STORAGE_FILE}`);
    } catch (error) {
      console.error('[FILE STORAGE] Failed to save to storage:', error);
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
      console.log(`[FILE STORAGE] Removed ${removedCount} old logs (older than ${daysOld} days)`);
    }
    
    return cleanedLogs;
  }

  /**
   * Get storage usage information
   */
  getStorageUsage(logs: ServiceCall[]): { sizeKB: number; percentage: number } {
    try {
      if (fs.existsSync(this.STORAGE_FILE)) {
        const stats = fs.statSync(this.STORAGE_FILE);
        const sizeKB = Math.round(stats.size / 1024);
        const maxStorage = 10 * 1024; // 10MB reasonable limit for JSON file
        const percentage = Math.round((sizeKB / maxStorage) * 100);
        
        return { sizeKB, percentage };
      }
      return { sizeKB: 0, percentage: 0 };
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
      console.log(`[FILE STORAGE] Removed ${excess} oldest logs to maintain limit of ${maxLogs}`);
      return trimmedLogs;
    }
    return logs;
  }

  /**
   * Clear all storage
   */
  clearStorage(): void {
    try {
      if (fs.existsSync(this.STORAGE_FILE)) {
        fs.unlinkSync(this.STORAGE_FILE);
        console.log('[FILE STORAGE] Cleared all stored logs');
      }
    } catch (error) {
      console.error('[FILE STORAGE] Failed to clear storage:', error);
    }
  }
}