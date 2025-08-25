// Service call logging system with persistent storage and enhanced functionality
import { ServiceCall } from '@/lib/types/service';

/**
 * HistoryLogger - Comprehensive service call logging with persistence
 * 
 * Features:
 * - In-memory logging for fast access
 * - LocalStorage persistence for browser sessions
 * - Enhanced statistics and analytics
 * - Call filtering and search capabilities
 * - Export functionality for debugging
 */
class HistoryLogger {
  private logs: ServiceCall[] = [];
  private readonly STORAGE_KEY = 'kozan_service_history';
  private readonly MAX_LOGS = 1000; // Prevent memory issues

  constructor() {
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
   * Get a specific call by ID
   */
  getCall(id: string): ServiceCall | undefined {
    return this.logs.find(log => log.id === id);
  }

  /**
   * Get all calls for a specific run
   */
  getCallsForRun(runId: string): ServiceCall[] {
    return this.logs.filter(log => log.runId === runId)
                   .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all calls for a specific service
   */
  getCallsForService(service: string): ServiceCall[] {
    return this.logs.filter(log => log.service === service)
                   .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all calls sorted by timestamp (newest first)
   */
  getAllCalls(): ServiceCall[] {
    return [...this.logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Search calls by parameters or error messages
   */
  searchCalls(query: string): ServiceCall[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log => {
      const searchableText = [
        log.service,
        log.action,
        log.error || '',
        log.resultPath || '',
        JSON.stringify(log.parameters)
      ].join(' ').toLowerCase();
      
      return searchableText.includes(lowerQuery);
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Filter calls by criteria
   */
  filterCalls(criteria: CallFilter): ServiceCall[] {
    return this.logs.filter(log => {
      if (criteria.service && log.service !== criteria.service) return false;
      if (criteria.action && log.action !== criteria.action) return false;
      if (criteria.status && log.status !== criteria.status) return false;
      if (criteria.runId && log.runId !== criteria.runId) return false;
      if (criteria.dateFrom && log.timestamp < criteria.dateFrom) return false;
      if (criteria.dateTo && log.timestamp > criteria.dateTo) return false;
      return true;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    const removedCount = initialCount - this.logs.length;
    
    if (removedCount > 0) {
      this.saveToStorage();
      console.log(`[SERVICE LOG] Removed ${removedCount} old logs (older than ${daysOld} days)`);
    }
    
    return removedCount;
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): HistoryStats {
    const totalCalls = this.logs.length;
    const successCalls = this.logs.filter(log => log.status === 'success').length;
    const errorCalls = this.logs.filter(log => log.status === 'error').length;
    const pendingCalls = this.logs.filter(log => log.status === 'pending').length;

    const completedCalls = this.logs.filter(log => log.duration !== undefined);
    const avgDuration = completedCalls.length > 0 ? 
      completedCalls.reduce((sum, log) => sum + (log.duration || 0), 0) / completedCalls.length : 0;

    const serviceStats = {
      huhu: {
        total: this.logs.filter(log => log.service === 'huhu').length,
        success: this.logs.filter(log => log.service === 'huhu' && log.status === 'success').length,
        error: this.logs.filter(log => log.service === 'huhu' && log.status === 'error').length,
        avgDuration: this.getServiceAvgDuration('huhu')
      },
      fashn: {
        total: this.logs.filter(log => log.service === 'fashn').length,
        success: this.logs.filter(log => log.service === 'fashn' && log.status === 'success').length,
        error: this.logs.filter(log => log.service === 'fashn' && log.status === 'error').length,
        avgDuration: this.getServiceAvgDuration('fashn')
      },
      fitroom: {
        total: this.logs.filter(log => log.service === 'fitroom').length,
        success: this.logs.filter(log => log.service === 'fitroom' && log.status === 'success').length,
        error: this.logs.filter(log => log.service === 'fitroom' && log.status === 'error').length,
        avgDuration: this.getServiceAvgDuration('fitroom')
      }
    };

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentCalls = this.logs.filter(log => log.timestamp >= yesterday).length;

    return {
      totalCalls,
      successCalls,
      errorCalls,
      pendingCalls,
      successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
      avgDuration: Math.round(avgDuration),
      serviceStats,
      recentActivity: recentCalls,
      storageUsage: this.getStorageUsage()
    };
  }

  /**
   * Get average duration for a specific service
   */
  private getServiceAvgDuration(service: string): number {
    const serviceCalls = this.logs.filter(log => log.service === service && log.duration !== undefined);
    if (serviceCalls.length === 0) return 0;
    
    const totalDuration = serviceCalls.reduce((sum, log) => sum + (log.duration || 0), 0);
    return Math.round(totalDuration / serviceCalls.length);
  }

  /**
   * Get storage usage information
   */
  private getStorageUsage(): { sizeKB: number; percentage: number } {
    try {
      const data = JSON.stringify(this.logs);
      const sizeBytes = new Blob([data]).size;
      const sizeKB = Math.round(sizeBytes / 1024);
      const maxStorage = 5 * 1024; // Assume 5MB localStorage limit
      const percentage = Math.round((sizeKB / maxStorage) * 100);
      
      return { sizeKB, percentage };
    } catch (_error) {
      return { sizeKB: 0, percentage: 0 };
    }
  }

  /**
   * Export logs for debugging or analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Service', 'Action', 'Status', 'Timestamp', 'Duration', 'Run ID', 'Error', 'Result Path'];
      const rows = this.logs.map(log => [
        log.id,
        log.service,
        log.action,
        log.status,
        log.timestamp.toISOString(),
        log.duration?.toString() || '',
        log.runId,
        log.error || '',
        log.resultPath || ''
      ]);
      
      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get processing insights and recommendations
   */
  getInsights(): ProcessingInsights {
    const stats = this.getStats();
    const insights: ProcessingInsights = {
      recommendations: [],
      trends: {},
      issues: []
    };

    // Success rate recommendations
    if (stats.successRate < 80) {
      insights.recommendations.push({
        type: 'reliability',
        message: `Success rate is ${stats.successRate}%. Consider investigating error patterns.`,
        priority: 'high'
      });
    }

    // Performance recommendations
    if (stats.avgDuration > 30000) { // 30 seconds
      insights.recommendations.push({
        type: 'performance',
        message: `Average processing time is ${Math.round(stats.avgDuration/1000)}s. Consider optimizing workflows.`,
        priority: 'medium'
      });
    }

    // Service-specific insights
    Object.entries(stats.serviceStats).forEach(([service, serviceStats]) => {
      if (serviceStats.error > serviceStats.success && serviceStats.total > 5) {
        insights.issues.push({
          service: service as 'huhu' | 'fashn' | 'fitroom',
          issue: 'high_error_rate',
          description: `${service.toUpperCase()} has ${serviceStats.error} errors vs ${serviceStats.success} successes`,
          severity: 'high'
        });
      }
    });

    return insights;
  }

  /**
   * Clear all history logs (admin operation)
   */
  clearAllHistory(): number {
    const clearedCount = this.logs.length;
    this.logs = [];
    this.saveToStorage();
    console.log(`[SERVICE LOG] Cleared all ${clearedCount} logs from history`);
    return clearedCount;
  }

  /**
   * Load logs from localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') return; // SSR safety
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: ServiceCall) => ({
          ...log,
          timestamp: new Date(log.timestamp) // Convert ISO string back to Date
        }));
        console.log(`[SERVICE LOG] Loaded ${this.logs.length} logs from storage`);
      }
    } catch (_error) {
      console.error('[SERVICE LOG] Failed to load from storage:', error);
      this.logs = [];
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return; // SSR safety
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (_error) {
      console.error('[SERVICE LOG] Failed to save to storage:', error);
      
      // If storage is full, try clearing old logs and save again
      if (error.name === 'QuotaExceededError') {
        const removed = this.clearOldLogs(1); // Clear logs older than 1 day
        if (removed > 0) {
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
          } catch (retryError) {
            console.error('[SERVICE LOG] Still failed to save after clearing old logs:', retryError);
          }
        }
      }
    }
  }

  /**
   * Maintain log limit to prevent memory issues
   */
  private maintainLogLimit(): void {
    if (this.logs.length > this.MAX_LOGS) {
      const excess = this.logs.length - this.MAX_LOGS;
      this.logs = this.logs.slice(excess); // Remove oldest logs
      console.log(`[SERVICE LOG] Removed ${excess} oldest logs to maintain limit of ${this.MAX_LOGS}`);
    }
  }
}

// Singleton instance
export const historyLogger = new HistoryLogger();

// Additional utility types for enhanced functionality
export interface CallFilter {
  service?: string;
  action?: string;
  status?: 'pending' | 'success' | 'error';
  runId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ServiceStats {
  total: number;
  success: number;
  error: number;
  avgDuration: number;
}

export interface HistoryStats {
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  pendingCalls: number;
  successRate: number;
  avgDuration: number;
  serviceStats: {
    huhu: ServiceStats;
    fashn: ServiceStats;
    fitroom: ServiceStats;
  };
  recentActivity: number;
  storageUsage: {
    sizeKB: number;
    percentage: number;
  };
}

export interface ProcessingInsights {
  recommendations: Array<{
    type: 'performance' | 'reliability' | 'optimization';
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  trends: Record<string, unknown>;
  issues: Array<{
    service: 'huhu' | 'fashn' | 'fitroom';
    issue: 'high_error_rate' | 'slow_processing' | 'frequent_failures';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}