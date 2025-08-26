import { ServiceCall } from '@/lib/types/service';

export interface CallFilter {
  service?: string;
  action?: string;
  status?: 'pending' | 'success' | 'error';
  runId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * QueryManager - Handles searching, filtering, and querying service call logs
 * Separated from main logger for better maintainability
 */
export class QueryManager {
  
  /**
   * Get all calls sorted by timestamp (newest first)
   */
  getAllCalls(logs: ServiceCall[]): ServiceCall[] {
    return [...logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get a specific call by ID
   */
  getCall(logs: ServiceCall[], id: string): ServiceCall | undefined {
    return logs.find(log => log.id === id);
  }

  /**
   * Get all calls for a specific run
   */
  getCallsForRun(logs: ServiceCall[], runId: string): ServiceCall[] {
    return logs.filter(log => log.runId === runId)
               .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all calls for a specific service
   */
  getCallsForService(logs: ServiceCall[], service: string): ServiceCall[] {
    return logs.filter(log => log.service === service)
               .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Search calls by parameters or error messages
   */
  searchCalls(logs: ServiceCall[], query: string): ServiceCall[] {
    const lowerQuery = query.toLowerCase();
    return logs.filter(log => {
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
  filterCalls(logs: ServiceCall[], criteria: CallFilter): ServiceCall[] {
    return logs.filter(log => {
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
   * Get calls within a date range
   */
  getCallsInDateRange(logs: ServiceCall[], startDate: Date, endDate: Date): ServiceCall[] {
    return logs.filter(log => 
      log.timestamp >= startDate && log.timestamp <= endDate
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent calls (within specified hours)
   */
  getRecentCalls(logs: ServiceCall[], hoursBack: number = 24): ServiceCall[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    
    return logs.filter(log => log.timestamp >= cutoffTime)
               .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get failed calls
   */
  getFailedCalls(logs: ServiceCall[]): ServiceCall[] {
    return logs.filter(log => log.status === 'error')
               .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get successful calls
   */
  getSuccessfulCalls(logs: ServiceCall[]): ServiceCall[] {
    return logs.filter(log => log.status === 'success')
               .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get pending calls
   */
  getPendingCalls(logs: ServiceCall[]): ServiceCall[] {
    return logs.filter(log => log.status === 'pending')
               .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}