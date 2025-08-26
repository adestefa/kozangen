import { useState, useEffect } from 'react';
import { useRuns, useRun } from '@/hooks/useRuns';
import { useNotifications } from '@/hooks/useNotifications';

export interface InputImages {
  model?: { type: 'model', path: string, filename: string };
  clothing?: { type: 'clothing', path: string, filename: string };
  person?: { type: 'person', path: string, filename: string };
}

export interface UseRunManagerReturn {
  // State
  selectedRun: string;
  inputImages: InputImages;
  inputsLocked: boolean;
  runStatus: 'draft' | 'locked' | 'completed' | 'archived';
  
  // Data
  runs: Array<{ id: string; name: string; status: string; createdAt: string; lastActivity: string }>;
  run: { id: string; name: string; status: string; inputImages?: InputImages; results?: Array<unknown> } | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  handleRunSelect: (runId: string) => void;
  handleNewRun: () => Promise<void>;
  saveRunState: () => Promise<void>;
  lockRun: () => Promise<void>;
  updateInputImages: (newImages: InputImages) => Promise<void>;
}

export function useRunManager(): UseRunManagerReturn {
  // Data fetching hooks
  const { runs, isLoading: runsLoading, error: runsError, refetch: refetchRuns } = useRuns();
  
  // Local state
  const [selectedRun, setSelectedRun] = useState<string>('');
  const [inputImages, setInputImages] = useState<InputImages>({});
  const [inputsLocked, setInputsLocked] = useState(false);
  const [runStatus, setRunStatus] = useState<'draft' | 'locked' | 'completed' | 'archived'>('draft');

  // Get selected run data
  const { run, isLoading: runLoading, error: runError } = useRun(selectedRun);
  
  // Notifications
  const { showError, showInfo } = useNotifications();
  
  // Load run data when run changes
  useEffect(() => {
    if (run) {
      setInputImages(run.inputImages || {});
      setRunStatus(run.status || 'draft');
      setInputsLocked(run.status === 'locked' || run.status === 'completed');
    }
  }, [run]);

  // Handle run selection
  const handleRunSelect = (runId: string) => {
    setSelectedRun(runId);
    // Don't clear images - they will load from run data
  };

  // Handle new run creation
  const handleNewRun = async () => {
    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Run ${new Date().toLocaleString()}` })
      });
      
      const result = await response.json();
      if (result.success) {
        const newRunId = result.data.id;
        setSelectedRun(newRunId);
        setInputImages({});
        setInputsLocked(false);
        setRunStatus('draft');
        refetchRuns(); // Refresh runs list
        showInfo('New Run Created', `Starting new run: ${newRunId}`);
      } else {
        showError('Failed to Create Run', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error creating new run:', error);
      showError('Failed to Create Run', 'Network error');
    }
  };

  // Update run with current state
  const saveRunState = async () => {
    if (!selectedRun) return;
    
    try {
      await fetch(`/api/run/${selectedRun}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputImages,
          status: runStatus,
          lastActivity: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error saving run state:', error);
    }
  };

  // Lock run when generation starts
  const lockRun = async () => {
    if (!selectedRun) return;
    
    try {
      const response = await fetch(`/api/run/${selectedRun}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputImages,
          status: 'locked',
          lockedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        setRunStatus('locked');
        setInputsLocked(true);
        refetchRuns(); // Update runs list
      }
    } catch (error) {
      console.error('Error locking run:', error);
    }
  };

  // Update input images and save to run
  const updateInputImages = async (newImages: InputImages) => {
    setInputImages(newImages);
    
    // Save to run if not locked
    if (runStatus === 'draft' && selectedRun) {
      try {
        await fetch(`/api/run/${selectedRun}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputImages: newImages,
            lastActivity: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Error saving input images:', error);
      }
    }
  };

  return {
    // State
    selectedRun,
    inputImages,
    inputsLocked,
    runStatus,
    
    // Data
    runs: runs || [],
    run,
    isLoading: runsLoading || runLoading,
    error: runsError || runError,
    
    // Actions
    handleRunSelect,
    handleNewRun,
    saveRunState,
    lockRun,
    updateInputImages,
  };
}