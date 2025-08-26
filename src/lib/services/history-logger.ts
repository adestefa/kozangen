// Refactored service call logging system with modular architecture
import { ServiceCall } from '@/lib/types/service';
import { StorageManager } from './history/storage-manager';
import { StatisticsAnalyzer } from './history/statistics-analyzer';
import { QueryManager } from './history/query-manager';

// Re-export types for backward compatibility
export type { 
  CallFilter, 
  ServiceStats, 
  HistoryStats, 
  ProcessingInsights 
} from './history/statistics-analyzer';
export type { CallFilter as QueryFilter } from './history/query-manager';

/**
 * HistoryLogger - Refactored with modular architecture
 * Core logging functionality with specialized modules for different concerns
 */
class HistoryLogger {
  private logs: ServiceCall[] = [];
  private readonly MAX_LOGS = 1000;
  
  // Specialized modules
  private storageManager: StorageManager;
  private statisticsAnalyzer: StatisticsAnalyzer;
  private queryManager: QueryManager;

  constructor() {
    this.storageManager = new StorageManager();
    this.statisticsAnalyzer = new StatisticsAnalyzer();
    this.queryManager = new QueryManager();
    
    this.loadFromStorage();
  }

  /**
   * Log a new service call
   */
  logCall(call: Omit<ServiceCall, 'id' | 'timestamp'>): string {
    const id = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logEntry: ServiceCall = {
      ...call,
      id,
      timestamp: new Date()
    };

    this.logs.push(logEntry);
    this.maintainLogLimit();
    this.saveToStorage();
    
    console.log(`[SERVICE LOG] ${call.service.toUpperCase()} ${call.action} started:`, logEntry);

    return id;
  }

  /**
   * Update an existing service call
   */
  updateCall(id: string, updates: Partial<ServiceCall>): void {
    const index = this.logs.findIndex(log => log.id === id);
    if (index !== -1) {
      this.logs[index] = { ...this.logs[index], ...updates };
      this.saveToStorage();
      console.log(`[SERVICE LOG] Updated call ${id}:`, updates);
    }
  }

  /**
   * Mark a call as successful
   */
  markSuccess(id: string, resultPath: string, duration?: number): void {
    this.updateCall(id, {
      status: 'success',
      resultPath,
      duration
    });
  }

  /**
   * Mark a call as failed
   */
  markError(id: string, error: string, duration?: number): void {
    this.updateCall(id, {
      status: 'error',
      error,
      duration
    });
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.saveToStorage();
    console.log('[SERVICE LOG] History cleared');
  }

  /**
   * Clear logs older than specified days
   */
  clearOldLogs(daysOld: number = 7): number {
    const initialCount = this.logs.length;
    this.logs = this.storageManager.clearOldLogs(this.logs, daysOld);
    const removedCount = initialCount - this.logs.length;
    
    if (removedCount > 0) {
      this.saveToStorage();
    }
    
    return removedCount;
  }

  /**
   * Clear all history logs (admin operation)
   */
  clearAllHistory(): number {
    const clearedCount = this.logs.length;
    this.logs = [];
    this.storageManager.clearStorage();
    console.log(`[SERVICE LOG] Cleared all ${clearedCount} logs from history`);
    return clearedCount;
  }

  // Delegate query operations to QueryManager
  getCall(id: string) { return this.queryManager.getCall(this.logs, id); }
  getCallsForRun(runId: string) { return this.queryManager.getCallsForRun(this.logs, runId); }
  getCallsForService(service: string) { return this.queryManager.getCallsForService(this.logs, service); }
  getAllCalls() { return this.queryManager.getAllCalls(this.logs); }
  searchCalls(query: string) { return this.queryManager.searchCalls(this.logs, query); }
  filterCalls(criteria: import('./history/query-manager').CallFilter) { return this.queryManager.filterCalls(this.logs, criteria); }

  // Delegate statistics operations to StatisticsAnalyzer
  getStats() { 
    const storageUsage = this.storageManager.getStorageUsage(this.logs);
    return this.statisticsAnalyzer.getStats(this.logs, storageUsage);
  }
  getInsights() { return this.statisticsAnalyzer.getInsights(this.getStats()); }
  exportLogs(format: 'json' | 'csv' = 'json') { return this.statisticsAnalyzer.exportLogs(this.logs, format); }

  /**
   * Load logs from storage
   */
  private loadFromStorage(): void {
    this.logs = this.storageManager.loadFromStorage();
  }

  /**
   * Save logs to storage
   */
  private saveToStorage(): void {
    this.storageManager.saveToStorage(this.logs);
  }

  /**
   * Maintain log limit
   */
  private maintainLogLimit(): void {
    this.logs = this.storageManager.maintainLogLimit(this.logs, this.MAX_LOGS);
  }
}

// Singleton instance
export const historyLogger = new HistoryLogger();