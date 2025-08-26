// Service API Logger - Simple but robust logging for Chad and Melis visibility
import { RunManager } from './run-manager';

export type ServiceStep = 
  | 'connecting' 
  | 'received' 
  | 'processing' 
  | 'completed' 
  | 'downloading' 
  | 'ready'
  | 'error';

export type ServiceError = 
  | 'rate_limited'
  | 'out_of_tokens' 
  | 'service_down'
  | 'bad_request'
  | 'timeout'
  | 'unknown_error';

export interface ServiceStepLog {
  step: ServiceStep;
  timestamp: string;
  message: string;
  jobId?: string;
  progress?: number;
  error?: ServiceError;
}

export interface ServiceStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  currentStep: ServiceStep;
  jobId?: string;
  error?: ServiceError;
  startTime?: string;
  endTime?: string;
  steps: ServiceStepLog[];
}

/**
 * Simple service logger for comprehensive API tracking
 * Provides visibility for Chad and Melis + debugging capabilities
 */
export class ServiceLogger {
  private static getStepMessage(service: string, step: ServiceStep, jobId?: string, extra?: string): string {
    const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
    
    switch (step) {
      case 'connecting':
        return `Connecting to ${serviceName} API...`;
      case 'received':
        return jobId ? `${serviceName} accepted request, job ID: ${jobId}` : `${serviceName} accepted request`;
      case 'processing':
        return extra || `${serviceName} processing your fashion generation...`;
      case 'completed':
        return `${serviceName} generation completed successfully`;
      case 'downloading':
        return `Downloading result image from ${serviceName}...`;
      case 'ready':
        return extra ? `Image ready - ${extra}` : `${serviceName} image ready`;
      case 'error':
        return extra || `${serviceName} encountered an error`;
      default:
        return `${serviceName} status update`;
    }
  }

  private static getErrorMessage(error: ServiceError): string {
    switch (error) {
      case 'rate_limited':
        return 'Rate limit reached. Please try again in a few minutes.';
      case 'out_of_tokens':
        return 'Insufficient credits. Please add more tokens to continue.';
      case 'service_down':
        return 'Service is temporarily unavailable. Please try again later.';
      case 'bad_request':
        return 'Invalid request parameters. Please check your inputs.';
      case 'timeout':
        return 'Request timed out. The service may be experiencing high load.';
      case 'unknown_error':
        return 'An unexpected error occurred. Please try again.';
      default:
        return 'Service error occurred';
    }
  }

  /**
   * Log a processing step for a service (defensive version)
   */
  static logStep(
    runId: string, 
    service: string, 
    step: ServiceStep, 
    jobId?: string,
    extra?: string
  ): void {
    try {
      // Always log to console for debugging even if metadata fails
      const message = this.getStepMessage(service, step, jobId, extra);
      console.log(`[${service.toUpperCase()}] ${message}`);

      // Try to get metadata, but don't fail if it doesn't exist
      let metadata;
      try {
        metadata = RunManager.getMetadata(runId);
      } catch (error) {
        console.warn(`[${service.toUpperCase()}] Could not get metadata for ${runId}, step logged to console only`);
        return;
      }
      
      // Initialize service status if not exists
      if (!metadata.services) {
        metadata.services = {};
      }
      
      if (!metadata.services[service]) {
        metadata.services[service] = {
          status: 'idle',
          currentStep: step,
          steps: [],
          versions: [],
          current_version: 0
        };
      }

      const serviceStatus = metadata.services[service];
      
      // Add step to log
      const stepLog: ServiceStepLog = {
        step,
        timestamp: new Date().toISOString(),
        message,
        jobId,
      };

      if (!serviceStatus.steps) {
        serviceStatus.steps = [];
      }

      serviceStatus.steps.push(stepLog);
      serviceStatus.currentStep = step;
      
      // Update overall status
      if (step === 'connecting') {
        serviceStatus.status = 'processing';
        serviceStatus.startTime = stepLog.timestamp;
      } else if (step === 'ready') {
        serviceStatus.status = 'completed';
        serviceStatus.endTime = stepLog.timestamp;
      } else if (step === 'error') {
        serviceStatus.status = 'failed';
        serviceStatus.endTime = stepLog.timestamp;
      }

      RunManager.saveMetadata(runId, metadata);
    } catch (error) {
      console.error(`[${service.toUpperCase()}] Failed to log step, but continuing:`, error);
    }
  }

  /**
   * Log an error state (defensive version)
   */
  static logError(
    runId: string, 
    service: string, 
    error: ServiceError,
    details?: string
  ): void {
    try {
      // Always log to console for debugging even if metadata fails
      const errorMessage = this.getErrorMessage(error);
      const message = details ? `${errorMessage} ${details}` : errorMessage;
      console.error(`[${service.toUpperCase()}] ERROR: ${message}`);

      // Try to get metadata, but don't fail if it doesn't exist
      let metadata;
      try {
        metadata = RunManager.getMetadata(runId);
      } catch (metadataError) {
        console.warn(`[${service.toUpperCase()}] Could not get metadata for ${runId}, error logged to console only`);
        return;
      }
      
      // Initialize services if not exists
      if (!metadata.services) {
        metadata.services = {};
      }
      
      if (!metadata.services[service]) {
        metadata.services[service] = {
          status: 'failed',
          currentStep: 'error',
          steps: [],
          versions: [],
          current_version: 0
        };
      }

      const serviceStatus = metadata.services[service];
      
      const stepLog: ServiceStepLog = {
        step: 'error',
        timestamp: new Date().toISOString(),
        message,
        error
      };

      if (!serviceStatus.steps) {
        serviceStatus.steps = [];
      }

      serviceStatus.steps.push(stepLog);
      serviceStatus.currentStep = 'error';
      serviceStatus.status = 'failed';
      serviceStatus.error = error;
      serviceStatus.endTime = stepLog.timestamp;

      RunManager.saveMetadata(runId, metadata);
    } catch (logError) {
      console.error(`[${service.toUpperCase()}] Failed to log error, but continuing:`, logError);
    }
  }

  /**
   * Get current status for UI display
   */
  static getServiceStatus(runId: string, service: string): ServiceStatus | null {
    try {
      const metadata = RunManager.getMetadata(runId);
      const serviceData = metadata.services[service];
      
      if (!serviceData) {
        return null;
      }

      return {
        status: serviceData.status || 'idle',
        currentStep: serviceData.currentStep || 'connecting',
        jobId: serviceData.jobId,
        error: serviceData.error,
        startTime: serviceData.startTime,
        endTime: serviceData.endTime,
        steps: serviceData.steps || []
      };
    } catch (error) {
      console.error(`Failed to get status for ${service}:`, error);
      return null;
    }
  }

  /**
   * Get elapsed time for current processing
   */
  static getElapsedTime(runId: string, service: string): string {
    const status = this.getServiceStatus(runId, service);
    if (!status || !status.startTime) {
      return '0s';
    }

    const start = new Date(status.startTime).getTime();
    const now = status.endTime ? new Date(status.endTime).getTime() : Date.now();
    const elapsed = Math.floor((now - start) / 1000);

    if (elapsed < 60) {
      return `${elapsed}s`;
    } else if (elapsed < 3600) {
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Clear service logs (for new generation)
   */
  static clearServiceLogs(runId: string, service: string): void {
    try {
      const metadata = RunManager.getMetadata(runId);
      
      if (metadata.services[service]) {
        metadata.services[service].steps = [];
        metadata.services[service].status = 'idle';
        metadata.services[service].currentStep = 'connecting';
        metadata.services[service].error = undefined;
        metadata.services[service].startTime = undefined;
        metadata.services[service].endTime = undefined;
      }

      RunManager.saveMetadata(runId, metadata);
    } catch (error) {
      console.error(`Failed to clear logs for ${service}:`, error);
    }
  }
}