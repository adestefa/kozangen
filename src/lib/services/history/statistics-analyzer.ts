import { ServiceCall } from '@/lib/types/service';

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

/**
 * StatisticsAnalyzer - Handles analytics and insights for service call history
 * Separated from main logger for better maintainability
 */
export class StatisticsAnalyzer {
  
  /**
   * Get comprehensive statistics from logs
   */
  getStats(logs: ServiceCall[], storageUsage: { sizeKB: number; percentage: number }): HistoryStats {
    const totalCalls = logs.length;
    const successCalls = logs.filter(log => log.status === 'success').length;
    const errorCalls = logs.filter(log => log.status === 'error').length;
    const pendingCalls = logs.filter(log => log.status === 'pending').length;

    const completedCalls = logs.filter(log => log.duration !== undefined);
    const avgDuration = completedCalls.length > 0 ? 
      completedCalls.reduce((sum, log) => sum + (log.duration || 0), 0) / completedCalls.length : 0;

    const serviceStats = {
      huhu: this.getServiceStats(logs, 'huhu'),
      fashn: this.getServiceStats(logs, 'fashn'),
      fitroom: this.getServiceStats(logs, 'fitroom')
    };

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentCalls = logs.filter(log => log.timestamp >= yesterday).length;

    return {
      totalCalls,
      successCalls,
      errorCalls,
      pendingCalls,
      successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
      avgDuration: Math.round(avgDuration),
      serviceStats,
      recentActivity: recentCalls,
      storageUsage
    };
  }

  /**
   * Get statistics for a specific service
   */
  private getServiceStats(logs: ServiceCall[], service: string): ServiceStats {
    const serviceLogs = logs.filter(log => log.service === service);
    return {
      total: serviceLogs.length,
      success: serviceLogs.filter(log => log.status === 'success').length,
      error: serviceLogs.filter(log => log.status === 'error').length,
      avgDuration: this.getServiceAvgDuration(logs, service)
    };
  }

  /**
   * Get average duration for a specific service
   */
  private getServiceAvgDuration(logs: ServiceCall[], service: string): number {
    const serviceCalls = logs.filter(log => log.service === service && log.duration !== undefined);
    if (serviceCalls.length === 0) return 0;
    
    const totalDuration = serviceCalls.reduce((sum, log) => sum + (log.duration || 0), 0);
    return Math.round(totalDuration / serviceCalls.length);
  }

  /**
   * Generate processing insights and recommendations
   */
  getInsights(stats: HistoryStats): ProcessingInsights {
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
   * Export logs in various formats
   */
  exportLogs(logs: ServiceCall[], format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Service', 'Action', 'Status', 'Timestamp', 'Duration', 'Run ID', 'Error', 'Result Path'];
      const rows = logs.map(log => [
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
    
    return JSON.stringify(logs, null, 2);
  }
}