// Runs data fetching hook using SWR
import useSWR, { mutate } from 'swr';
import { Run } from '@/lib/types/run';
import { ApiResponse, RunListResponse, ImageListResponse } from '@/lib/types/api';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch data');
  }
  const data: ApiResponse = await response.json();
  return data.data;
};

// Hook for fetching all runs list
export function useRuns() {
  const { data, error, isLoading, mutate: refetch } = useSWR<RunListResponse>(
    '/api/runs',
    fetcher,
    {
      refreshInterval: 0, // Don't auto-refresh
      revalidateOnFocus: false, // Don't revalidate when window gains focus
      dedupingInterval: 5000, // Cache for 5 seconds
    }
  );

  return {
    runs: data?.runs.map(run => ({
      ...run,
      timestamp: new Date(run.timestamp),
      lastActivity: new Date(run.lastActivity)
    })) || [],
    isLoading,
    error,
    refetch
  };
}

// Hook for fetching specific run details
export function useRun(runId: string | null) {
  const { data, error, isLoading, mutate: refetch } = useSWR<Run>(
    runId ? `/api/run/${runId}` : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      dedupingInterval: 10000, // Cache for 10 seconds
    }
  );

  return {
    run: data || null,
    isLoading,
    error,
    refetch
  };
}

// Hook for fetching available input images
export function useInputImages() {
  const { data, error, isLoading, mutate: refetch } = useSWR<ImageListResponse>(
    '/api/images',
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );

  return {
    images: data?.images || [],
    isLoading,
    error,
    refetch
  };
}

// Utility function to invalidate runs cache
export function invalidateRuns() {
  return mutate('/api/runs');
}

// Utility function to invalidate specific run cache
export function invalidateRun(runId: string) {
  return mutate(`/api/run/${runId}`);
}

// Utility function to invalidate images cache
export function invalidateImages() {
  return mutate('/api/images');
}

// Hook for real-time updates (can be extended with WebSocket/SSE later)
export function useRunUpdates(runId: string | null) {
  const { refetch } = useRun(runId);

  // Poll for updates when a run is active and has pending operations
  const startPolling = () => {
    const interval = setInterval(() => {
      if (runId) {
        refetch();
      }
    }, 2000); // Check every 2 seconds

    return interval;
  };

  const stopPolling = (interval: NodeJS.Timeout) => {
    clearInterval(interval);
  };

  return {
    startPolling,
    stopPolling
  };
}