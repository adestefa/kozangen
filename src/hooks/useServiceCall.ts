// Service call hook for generation operations
import { useState, useCallback } from 'react';
import { ServiceType, ServiceParameters } from '@/lib/types/service';
import { ApiResponse, GenerateResponse } from '@/lib/types/api';
import { invalidateRun } from './useRuns';

interface ServiceCallState {
  isGenerating: boolean;
  progress: string;
  error: string | null;
}

interface ServiceCallHook {
  state: ServiceCallState;
  generate: (service: ServiceType, runId: string, parameters: ServiceParameters) => Promise<GenerateResponse | null>;
  regenerate: (service: ServiceType, runId: string, parameters: ServiceParameters) => Promise<GenerateResponse | null>;
  clearError: () => void;
}

export function useServiceCall(): ServiceCallHook {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const callServiceAPI = useCallback(async (
    endpoint: string,
    method: 'POST' = 'POST',
    body: Record<string, unknown>
  ): Promise<GenerateResponse | null> => {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: ApiResponse<GenerateResponse> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const generate = useCallback(async (
    service: ServiceType,
    runId: string,
    parameters: ServiceParameters
  ): Promise<GenerateResponse | null> => {
    if (isGenerating) {
      throw new Error('Another generation is already in progress');
    }

    setIsGenerating(true);
    setError(null);
    setProgress(`Starting ${service} generation...`);

    try {
      const endpoint = `/api/${service}/generate`;
      const body = { runId, parameters };
      
      setProgress(`Processing with ${service} service...`);
      const result = await callServiceAPI(endpoint, 'POST', body);
      
      setProgress(`${service} generation completed successfully`);
      
      // Invalidate run cache to trigger refresh
      setTimeout(() => {
        invalidateRun(runId);
      }, 100);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      setProgress('');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, callServiceAPI]);

  const regenerate = useCallback(async (
    service: ServiceType,
    runId: string,
    parameters: ServiceParameters
  ): Promise<GenerateResponse | null> => {
    if (isGenerating) {
      throw new Error('Another generation is already in progress');
    }

    setIsGenerating(true);
    setError(null);
    setProgress(`Starting ${service} regeneration...`);

    try {
      const endpoint = `/api/${service}/regenerate`;
      const body = { runId, parameters };
      
      setProgress(`Processing with ${service} service...`);
      const result = await callServiceAPI(endpoint, 'POST', body);
      
      setProgress(`${service} regeneration completed successfully`);
      
      // Invalidate run cache to trigger refresh
      setTimeout(() => {
        invalidateRun(runId);
      }, 100);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Regeneration failed';
      setError(errorMessage);
      setProgress('');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, callServiceAPI]);

  return {
    state: { isGenerating, progress, error },
    generate,
    regenerate,
    clearError
  };
}

// Hook for managing multiple concurrent service calls
export function useMultiServiceCall() {
  const [services, setServices] = useState<Record<ServiceType, ServiceCallState>>({
    huhu: { isGenerating: false, progress: '', error: null },
    fashn: { isGenerating: false, progress: '', error: null },
    fitroom: { isGenerating: false, progress: '', error: null },
  });

  const updateServiceState = useCallback((service: ServiceType, updates: Partial<ServiceCallState>) => {
    setServices(prev => ({
      ...prev,
      [service]: { ...prev[service], ...updates }
    }));
  }, []);

  const callService = useCallback(async (
    service: ServiceType,
    action: 'generate' | 'regenerate',
    runId: string,
    parameters: ServiceParameters
  ): Promise<GenerateResponse | null> => {
    if (services[service].isGenerating) {
      throw new Error(`${service} is already processing`);
    }

    updateServiceState(service, { 
      isGenerating: true, 
      error: null, 
      progress: `Starting ${service} ${action}...` 
    });

    try {
      const endpoint = `/api/${service}/${action}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, parameters }),
      });

      const data: ApiResponse<GenerateResponse> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      updateServiceState(service, { 
        progress: `${service} ${action} completed successfully` 
      });

      // Refresh run data
      setTimeout(() => {
        invalidateRun(runId);
      }, 100);

      return data.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${action} failed`;
      updateServiceState(service, { 
        error: errorMessage, 
        progress: '' 
      });
      return null;
    } finally {
      updateServiceState(service, { isGenerating: false });
    }
  }, [services, updateServiceState]);

  const clearServiceError = useCallback((service: ServiceType) => {
    updateServiceState(service, { error: null });
  }, [updateServiceState]);

  const isAnyGenerating = Object.values(services).some(s => s.isGenerating);

  return {
    services,
    callService,
    clearServiceError,
    isAnyGenerating
  };
}