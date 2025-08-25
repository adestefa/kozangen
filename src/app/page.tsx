'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import RunSelector from '@/components/ui/RunSelector';
import InputPanel from '@/components/ui/InputPanel';
import ServiceCard from '@/components/ui/ServiceCard';
import ImageModal from '@/components/ui/ImageModal';
import HistoryPanel from '@/components/ui/HistoryPanel';
import { ServiceType, ServiceParameters } from '@/lib/types/service';
import { useRuns, useRun, useInputImages } from '@/hooks/useRuns';
import { useMultiServiceCall } from '@/hooks/useServiceCall';
import { useNotifications, useServiceNotifications } from '@/hooks/useNotifications';

export default function Dashboard() {
  // Data fetching hooks
  const { runs, isLoading: runsLoading, error: runsError, refetch: refetchRuns } = useRuns();
  const { images, isLoading: imagesLoading, error: imagesError, refetch: refetchImages } = useInputImages();
  
  // Local state
  const [selectedRun, setSelectedRun] = useState<string>('');
  const [imageModal, setImageModal] = useState<{isOpen: boolean, type: 'model' | 'clothing' | 'person' | null}>({isOpen: false, type: null});
  const [historyPanel, setHistoryPanel] = useState(false);
  const [inputImages, setInputImages] = useState<{
    model?: { type: 'model', path: string, filename: string };
    clothing?: { type: 'clothing', path: string, filename: string };
    person?: { type: 'person', path: string, filename: string };
  }>({});
  const [inputsLocked, setInputsLocked] = useState(false);
  const [runStatus, setRunStatus] = useState<'draft' | 'locked' | 'completed' | 'archived'>('draft');

  // Get selected run data
  const { run, isLoading: runLoading, error: _runError } = useRun(selectedRun);
  
  // Load run data when run changes
  useEffect(() => {
    if (run) {
      setInputImages(run.inputImages || {});
      setRunStatus(run.status || 'draft');
      setInputsLocked(run.status === 'locked' || run.status === 'completed');
    }
  }, [run]);
  
  // Service management
  const { services, callService, clearServiceError, isAnyGenerating } = useMultiServiceCall();
  
  // Notifications
  const { showError, showSuccess: _showSuccess, showInfo } = useNotifications();
  const { 
    notifyServiceStarted, 
    notifyServiceSuccess, 
    notifyServiceError,
    notifyMultipleServicesStarted,
    notifyAllServicesCompleted 
  } = useServiceNotifications();

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

  // Handle image selection modal
  const handleImageSelect = (type: 'model' | 'clothing' | 'person') => {
    if (inputsLocked) {
      // Open image in new tab for inspection when locked
      const image = inputImages[type];
      if (image) {
        window.open(`/api/static/${image.path.replace('/input/', '')}`, '_blank');
      }
      return;
    }
    setImageModal({isOpen: true, type});
  };

  const handleImageModalSelect = async (image: { type: string; path: string; filename: string }) => {
    if (imageModal.type) {
      const newInputImages = {
        ...inputImages,
        [imageModal.type!]: image
      };
      setInputImages(newInputImages);
      
      // Save to run if not locked
      if (runStatus === 'draft' && selectedRun) {
        try {
          await fetch(`/api/run/${selectedRun}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputImages: newInputImages,
              lastActivity: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error('Error saving input images:', error);
        }
      }
    }
    setImageModal({isOpen: false, type: null});
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

  // Generate service results
  const handleGenerate = async (service: ServiceType, parameters: ServiceParameters) => {
    if (!selectedRun) {
      showError('No Run Selected', 'Please select or create a run first');
      return;
    }

    if (!inputImages.model || !inputImages.clothing || !inputImages.person) {
      showError('Missing Images', 'Please select model, clothing, and person images');
      return;
    }

    clearServiceError(service);
    
    // Lock inputs and run when generation starts
    if (runStatus === 'draft') {
      await lockRun();
    }
    
    try {
      // Build service-specific parameters
      const serviceParams = {
        ...parameters,
        model_image: inputImages.model.path,
        top_garment: inputImages.clothing.path,
        bottom_garment: inputImages.person.path
      };

      notifyServiceStarted(service.toUpperCase(), 'generation');
      
      const result = await callService(service, 'generate', selectedRun, serviceParams);
      
      if (result) {
        notifyServiceSuccess(service.toUpperCase(), 'generation');
      } else {
        notifyServiceError(
          service.toUpperCase(),
          'generation',
          services[service].error || 'Unknown error occurred',
          () => handleGenerate(service, parameters)
        );
      }
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
      notifyServiceError(
        service.toUpperCase(),
        'generation', 
        errorMessage,
        () => handleGenerate(service, parameters)
      );
    }
  };

  // Regenerate service results
  const handleRegenerate = async (service: ServiceType, parameters: ServiceParameters) => {
    if (!selectedRun) {
      showError('No Run Selected', 'Please select a run first');
      return;
    }

    clearServiceError(service);

    try {
      const serviceParams = {
        ...parameters,
        model_image: inputImages.model?.path || '',
        top_garment: inputImages.clothing?.path || '',
        bottom_garment: inputImages.person?.path || ''
      };

      notifyServiceStarted(service.toUpperCase(), 'regeneration');
      
      const result = await callService(service, 'regenerate', selectedRun, serviceParams);
      
      if (result) {
        notifyServiceSuccess(service.toUpperCase(), 'regeneration');
      } else {
        notifyServiceError(
          service.toUpperCase(),
          'regeneration',
          services[service].error || 'Unknown error occurred',
          () => handleRegenerate(service, parameters)
        );
      }
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
      notifyServiceError(
        service.toUpperCase(),
        'regeneration',
        errorMessage,
        () => handleRegenerate(service, parameters)
      );
    }
  };

  // Generate all services simultaneously
  const handleGenerateAll = async () => {
    if (!selectedRun) {
      showError('No Run Selected', 'Please select or create a run first');
      return;
    }

    if (!inputImages.model || !inputImages.clothing || !inputImages.person) {
      showError('Missing Images', 'Please select model, clothing, and person images');
      return;
    }

    const servicesToRun: ServiceType[] = ['huhu', 'fashn', 'fitroom'];
    
    notifyMultipleServicesStarted(servicesToRun.map(s => s.toUpperCase()));

    try {
      // Run all services in parallel
      const promises = servicesToRun.map(async (service) => {
        const serviceParams = {
          model_image: inputImages.model!.path,
          top_garment: inputImages.clothing!.path,
          bottom_garment: inputImages.person!.path,
        };

        return callService(service, 'generate', selectedRun, serviceParams);
      });

      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value !== null
      ).length;

      notifyAllServicesCompleted(successCount, servicesToRun.length);
    } catch (_error) {
      showError('Batch Generation Failed', 'Some services encountered errors');
    }
  };

  const canGenerate = inputImages.model && inputImages.clothing && inputImages.person && selectedRun;

  // Loading states
  if (runsLoading || imagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (runsError || imagesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{runsError || imagesError}</p>
          <button
            onClick={() => {
              refetchRuns();
              refetchImages();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Run Selection */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Run:</span>
            <RunSelector
              runs={runs}
              selectedRun={selectedRun}
              onRunSelect={handleRunSelect}
              onNewRun={handleNewRun}
            />
          </div>
          
          {/* Run Info */}
          <div className="flex items-center gap-4">
            {selectedRun && run && (
              <div className="text-sm text-gray-600">
                {`Run: ${selectedRun} | Results: ${run.results?.length || 0}`}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* History Button */}
              <button
                onClick={() => setHistoryPanel(true)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="View Service History"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              
              {/* Generate All Button */}
              {canGenerate && (
                <button
                  onClick={handleGenerateAll}
                  disabled={isAnyGenerating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnyGenerating ? 'Generating...' : 'Generate All Services'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Images */}
        <div className="mb-8">
          <InputPanel
            images={inputImages}
            onImageSelect={handleImageSelect}
            disabled={runLoading}
            locked={inputsLocked}
          />
        </div>

        {/* AI Generated Results */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Generated Results</h2>
          <p className="text-sm text-gray-600">
            Click any image to view full-size. {isAnyGenerating && 'Services are currently processing...'}
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ServiceCard
            service="huhu"
            results={run?.results?.filter(r => r.service === 'huhu') || []}
            currentVersion={1}
            onGenerate={(params) => handleGenerate('huhu', params)}
            onRegenerate={(params) => handleRegenerate('huhu', params)}
            onVersionChange={() => {}}
            isGenerating={services.huhu.isGenerating}
            canGenerate={!!canGenerate}
            error={services.huhu.error}
            progress={services.huhu.progress}
            onClearError={() => clearServiceError('huhu')}
          />
          
          <ServiceCard
            service="fitroom"
            results={run?.results?.filter(r => r.service === 'fitroom') || []}
            currentVersion={1}
            onGenerate={(params) => handleGenerate('fitroom', params)}
            onRegenerate={(params) => handleRegenerate('fitroom', params)}
            onVersionChange={() => {}}
            isGenerating={services.fitroom.isGenerating}
            canGenerate={!!canGenerate}
            error={services.fitroom.error}
            progress={services.fitroom.progress}
            onClearError={() => clearServiceError('fitroom')}
          />
          
          <ServiceCard
            service="fashn"
            results={run?.results?.filter(r => r.service === 'fashn') || []}
            currentVersion={1}
            onGenerate={(params) => handleGenerate('fashn', params)}
            onRegenerate={(params) => handleRegenerate('fashn', params)}
            onVersionChange={() => {}}
            isGenerating={services.fashn.isGenerating}
            canGenerate={!!canGenerate}
            error={services.fashn.error}
            progress={services.fashn.progress}
            onClearError={() => clearServiceError('fashn')}
          />
        </div>
      </div>

      {/* Image Selection Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal({isOpen: false, type: null})}
        onSelect={handleImageModalSelect}
        imageType={imageModal.type || 'model'}
        images={images}
      />

      {/* History Panel */}
      <HistoryPanel
        isOpen={historyPanel}
        onClose={() => setHistoryPanel(false)}
      />
    </div>
  );
}