// FitRoom service controller - Mock implementation simulating FitRoom API v2 workflow
import { FitRoomParameters, ServiceResult } from '@/lib/types/service';
import { historyLogger } from './history-logger';
import { ServiceError, ValidationError } from '@/lib/utils/error-handler';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';

/**
 * FitRoom Manager - Simulates FitRoom AI single combo try-on process
 * Single call: Upload model + top + bottom simultaneously as multipart/form-data
 * 
 * Simulates: POST https://platform.fitroom.app/api/tryon/v2/tasks (single combo call)
 * Processing time: 3-4 minutes (180-240 seconds)
 * 
 * Unlike HuHu/FASHN which use sequential steps, FitRoom processes full outfit in one call
 */
export class FitRoomManager {
  private static instance: FitRoomManager;

  static getInstance(): FitRoomManager {
    if (!FitRoomManager.instance) {
      FitRoomManager.instance = new FitRoomManager();
    }
    return FitRoomManager.instance;
  }

  /**
   * Generate full outfit using FitRoom single combo process (mock)
   * Simulates: POST https://platform.fitroom.app/api/tryon/v2/tasks
   */
  async generate(
    runId: string,
    parameters: FitRoomParameters
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: 'fitroom',
      action: 'generate',
      parameters,
      status: 'pending',
      runId
    });

    showServiceStarted('FitRoom', 'generation');

    try {
      // Mock single combo generation process
      const result = await this.mockComboGenerate(runId, parameters);
      
      const duration = Date.now() - startTime;
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FitRoom', 'generation');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FitRoom', 'generation', errorMessage);
      
      throw error;
    }
  }

  /**
   * Regenerate outfit with different parameters (mock)
   */
  async regenerate(
    runId: string,
    parameters: FitRoomParameters,
    version = 1
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: 'fitroom',
      action: 'regenerate',
      parameters: { ...parameters, version },
      status: 'pending',
      runId
    });

    showServiceStarted('FitRoom', 'regeneration');

    try {
      // Mock regeneration with combo processing
      const result = await this.mockComboGenerate(runId, parameters, version + 1);
      
      const duration = Date.now() - startTime;
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FitRoom', 'regeneration');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FitRoom', 'regeneration', errorMessage);
      
      throw error;
    }
  }

  /**
   * Validate FitRoom API parameters
   */
  private validateParameters(parameters: FitRoomParameters): void {
    if (!parameters.model_image) {
      throw new ValidationError('Model image is required');
    }

    if (!parameters.top_garment) {
      throw new ValidationError('Top garment image is required (cloth_image)');
    }

    if (!parameters.bottom_garment) {
      throw new ValidationError('Bottom garment image is required (lower_cloth_image)');
    }

    // Validate cloth_type if provided (should always be 'combo' for full outfits)
    if (parameters.cloth_type && parameters.cloth_type !== 'combo') {
      throw new ValidationError('cloth_type must be "combo" for full outfit generation');
    }

    // Validate image file formats (FitRoom requires actual files, not URLs)
    const filePattern = /\.(jpg|jpeg|png|webp)$/i;
    if (!filePattern.test(parameters.model_image)) {
      throw new ValidationError('Model image must be a valid image file (jpg, png, webp)');
    }
    if (!filePattern.test(parameters.top_garment)) {
      throw new ValidationError('Top garment must be a valid image file (jpg, png, webp)');
    }
    if (!filePattern.test(parameters.bottom_garment)) {
      throw new ValidationError('Bottom garment must be a valid image file (jpg, png, webp)');
    }
  }

  /**
   * Mock FitRoom AI single combo process
   * Uploads model + top + bottom as multipart/form-data in single call
   */
  private async mockComboGenerate(
    runId: string,
    parameters: FitRoomParameters,
    version = 1
  ): Promise<ServiceResult> {
    console.log(`[FitRoom Mock] Starting combo process for run ${runId}`);

    // Simulate file download and preprocessing (FitRoom requires local files)
    console.log('[FitRoom Mock] Downloading and preprocessing images...');
    await this.simulateFileProcessing();

    // Single combo call with all three images
    console.log('[FitRoom Mock] Uploading multipart form-data (model + top + bottom)...');
    await this.simulateMultipartUpload();

    // Simulate combo processing - longer than individual steps but single call
    const hdMode = parameters.hd_mode || false;
    const processingTime = hdMode ? 8 : 6; // Demo: 6-8 seconds (real: 180-240 seconds)
    
    console.log(`[FitRoom Mock] Processing combo outfit (HD: ${hdMode})...`);
    await this.simulateApiCall('Combo processing', processingTime, processingTime + 2);

    // Simulate status polling until completion
    await this.simulateStatusPolling();

    // Simulate occasional failures
    if (Math.random() < 0.04) { // 4% failure rate
      throw new ServiceError('FitRoom combo processing failed: Out of memory during HD rendering', 'fitroom');
    }

    const finalResult: ServiceResult = {
      id: `fitroom_${runId}_v${version}_${Date.now()}`,
      service: 'fitroom',
      runId,
      version,
      imagePath: `/static/results/${runId}/fitroom/result_v${version}.jpg`,
      parameters,
      timestamp: new Date(),
      status: 'success'
    };

    console.log(`[FitRoom Mock] Combo process completed. Final result: ${finalResult.imagePath}`);
    return finalResult;
  }

  /**
   * Simulate file download and preprocessing (FitRoom needs local files)
   */
  private async simulateFileProcessing(): Promise<void> {
    console.log('[FitRoom Mock] Downloading model image...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[FitRoom Mock] Downloading top garment...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('[FitRoom Mock] Downloading bottom garment...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('[FitRoom Mock] Validating image formats and dimensions...');
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate file validation errors
    if (Math.random() < 0.02) { // 2% file validation error
      throw new ValidationError('Invalid image dimensions detected. FitRoom requires high-resolution images');
    }
  }

  /**
   * Simulate multipart/form-data upload
   */
  private async simulateMultipartUpload(): Promise<void> {
    console.log('[FitRoom Mock] Preparing multipart form-data...');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Simulate upload errors
    if (Math.random() < 0.01) { // 1% upload error
      throw new ServiceError('Upload failed: Connection timeout during multipart upload', 'fitroom');
    }

    console.log('[FitRoom Mock] Multipart upload completed successfully');
  }

  /**
   * Simulate FitRoom status polling (CREATED -> PROCESSING -> COMPLETED)
   */
  private async simulateStatusPolling(): Promise<void> {
    console.log('[FitRoom Mock] Status: CREATED -> PROCESSING...');
    
    // Simulate processing status checks
    const statusChecks = 3;
    for (let i = 0; i < statusChecks; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`[FitRoom Mock] Status check ${i + 1}/${statusChecks}: Still processing...`);
    }
    
    console.log('[FitRoom Mock] Status: PROCESSING -> COMPLETED');
  }

  /**
   * Simulate API call with realistic processing time and potential failures
   */
  private async simulateApiCall(step: string, minSeconds: number, maxSeconds: number): Promise<void> {
    const processingTime = (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
    console.log(`[FitRoom Mock] ${step} (estimated ${(processingTime/1000).toFixed(1)}s)...`);

    // Simulate API key errors
    if (Math.random() < 0.005) { // 0.5% auth error rate
      throw new ServiceError('Invalid X-API-KEY for FitRoom', 'fitroom');
    }

    // Simulate processing memory errors (FitRoom is resource intensive)
    if (Math.random() < 0.02) { // 2% memory error rate
      throw new ServiceError(`Out of memory during ${step}. Try reducing image resolution`, 'fitroom');
    }

    // Simulate network timeouts (longer processing = higher timeout risk)
    if (Math.random() < 0.01) { // 1% timeout error rate
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s then fail
      throw new ServiceError(`Network timeout during ${step}`, 'fitroom');
    }

    await new Promise(resolve => setTimeout(resolve, processingTime));
  }

  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      service: 'fitroom',
      name: 'FitRoom AI',
      version: 'v2',
      endpoint: 'https://platform.fitroom.app/api/tryon/v2/tasks',
      workflow: 'Single combo call with multipart upload',
      processingTime: '6-8 seconds (demo mode)', // In real mode: 180-240 seconds
      features: [
        'Single combo outfit processing',
        'Multipart form-data upload',
        'HD mode support',
        'Full outfit in one API call',
        'High-quality rendering'
      ],
      limitations: [
        'Requires local image files (no URLs)',
        'Large file uploads (multipart)',
        'Longer processing time vs competitors',
        'Memory intensive processing',
        'Single attempt per task (no retries)'
      ],
      requirements: {
        upload: 'multipart/form-data',
        imageFormat: 'JPG, PNG supported',
        maxFileSize: 'Not specified in docs',
        processing: '3-4 minutes typical'
      },
      uniqueFeatures: [
        'Only service using combo approach',
        'Processes both garments simultaneously',
        'No intermediate results',
        'Highest quality output',
        'Single point of failure'
      ]
    };
  }

  /**
   * Get processing estimate based on parameters
   */
  getProcessingEstimate(parameters: FitRoomParameters): { estimatedSeconds: number; factors: string[] } {
    let baseTime = 180; // 3 minutes base
    const factors: string[] = [];

    if (parameters.hd_mode) {
      baseTime += 60; // +1 minute for HD
      factors.push('HD mode (+1 min)');
    }

    // In demo mode, divide by 30 for faster testing
    const demoTime = Math.floor(baseTime / 30);

    return {
      estimatedSeconds: demoTime,
      factors: factors.length > 0 ? factors : ['Standard processing']
    };
  }
}

// Export singleton instance
export const fitroomManager = FitRoomManager.getInstance();