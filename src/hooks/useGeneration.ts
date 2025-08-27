import { ServiceType, ServiceParameters } from '@/lib/types/service';
import { useMultiServiceCall } from '@/hooks/useServiceCall';
import { useNotifications, useServiceNotifications } from '@/hooks/useNotifications';
import { InputImages } from '@/hooks/useRunManager';

export interface UseGenerationProps {
  selectedRun: string;
  inputImages: InputImages;
  runStatus: 'draft' | 'locked' | 'completed' | 'archived';
  lockRun: () => Promise<void>;
}

export interface UseGenerationReturn {
  // Service state
  services: Record<string, { isGenerating: boolean; error: string | null; progress?: number }>;
  isAnyGenerating: boolean;
  
  // Actions
  handleGenerate: (service: ServiceType, parameters: ServiceParameters) => Promise<void>;
  handleRegenerate: (service: ServiceType, parameters: ServiceParameters) => Promise<void>;
  handleGenerateAll: () => Promise<void>;
  clearServiceError: (service: ServiceType) => void;
  
  // Validation
  canGenerate: boolean;
}

export function useGeneration({ 
  selectedRun, 
  inputImages, 
  runStatus, 
  lockRun 
}: UseGenerationProps): UseGenerationReturn {
  // Service management
  const { services, callService, clearServiceError, isAnyGenerating } = useMultiServiceCall();
  
  // Notifications
  const { showError } = useNotifications();
  const { 
    notifyServiceStarted, 
    notifyServiceSuccess, 
    notifyServiceError,
    notifyMultipleServicesStarted,
    notifyAllServicesCompleted 
  } = useServiceNotifications();

  // Validation
  const canGenerate = Boolean(
    inputImages.model && 
    inputImages.top && 
    inputImages.bottom && 
    selectedRun
  );

  // Build service parameters from input images
  const buildServiceParams = (parameters: ServiceParameters) => {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:3003'; // fallback for SSR
    
    return {
      ...parameters,
      model_image: inputImages.model?.path ? `${baseUrl}/api/static${inputImages.model.path}` : '',
      top_garment: inputImages.top?.path ? `${baseUrl}/api/static${inputImages.top.path}` : '',
      bottom_garment: inputImages.bottom?.path ? `${baseUrl}/api/static${inputImages.bottom.path}` : ''
    };
  };

  // Generate service results
  const handleGenerate = async (service: ServiceType, parameters: ServiceParameters) => {
    if (!selectedRun) {
      showError('No Run Selected', 'Please select or create a run first');
      return;
    }

    if (!canGenerate) {
      showError('Missing Images', 'Please select model, top, and bottom images');
      return;
    }

    clearServiceError(service);
    
    // Lock inputs and run when generation starts
    if (runStatus === 'draft') {
      await lockRun();
    }
    
    try {
      const serviceParams = buildServiceParams(parameters);

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
    } catch (genError) {
      const errorMessage = genError instanceof Error ? genError.message : 'Unknown error';
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
      const serviceParams = buildServiceParams(parameters);

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
    } catch (regenError) {
      const errorMessage = regenError instanceof Error ? regenError.message : 'Unknown error';
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

    if (!canGenerate) {
      showError('Missing Images', 'Please select model, top, and bottom images');
      return;
    }

    const servicesToRun: ServiceType[] = ['huhu', 'fashn', 'fitroom'];
    
    notifyMultipleServicesStarted(servicesToRun.map(s => s.toUpperCase()));

    try {
      // Run all services in parallel
      const promises = servicesToRun.map(async (service) => {
        const serviceParams = buildServiceParams({});
        return callService(service, 'generate', selectedRun, serviceParams);
      });

      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value !== null
      ).length;

      notifyAllServicesCompleted(successCount, servicesToRun.length);
    } catch (batchError) {
      showError('Batch Generation Failed', 'Some services encountered errors');
    }
  };

  return {
    // Service state
    services,
    isAnyGenerating,
    
    // Actions
    handleGenerate,
    handleRegenerate,
    handleGenerateAll,
    clearServiceError,
    
    // Validation
    canGenerate,
  };
}