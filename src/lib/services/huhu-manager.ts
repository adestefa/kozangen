// HuHu service controller - Mock implementation simulating HuHu AI API v1 workflow
import { HuHuParameters, ServiceResult } from '@/lib/types/service';
import { historyLogger } from './history-logger';
import { ServiceError, ValidationError } from '@/lib/utils/error-handler';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';

/**
 * HuHu Manager - Simulates HuHu AI two-step try-on process
 * Step 1: Apply top garment to original model
 * Step 2: Apply bottom garment to Step 1 result
 * 
 * Simulates: POST https://api-service.huhu.ai/tryon/v1 (twice)
 * Processing time: 40-80 seconds per step (80-160 seconds total)
 */
export class HuHuManager {
  private static instance: HuHuManager;

  static getInstance(): HuHuManager {
    if (!HuHuManager.instance) {
      HuHuManager.instance = new HuHuManager();
    }
    return HuHuManager.instance;
  }

  /**
   * Generate full outfit using HuHu AI two-step process (mock)
   * Simulates: POST https://api-service.huhu.ai/tryon/v1 (twice)
   */
  async generate(
    runId: string,
    parameters: HuHuParameters
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: 'huhu',
      action: 'generate',
      parameters,
      status: 'pending',
      runId
    });

    showServiceStarted('HuHu', 'generation');

    try {
      // Mock two-step generation process
      const result = await this.mockTwoStepGenerate(runId, parameters);
      
      const duration = Date.now() - startTime;
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('HuHu', 'generation');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('HuHu', 'generation', errorMessage);
      
      throw error;
    }
  }

  /**
   * Regenerate outfit with different parameters (mock)
   */
  async regenerate(
    runId: string,
    parameters: HuHuParameters,
    version = 1
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: 'huhu',
      action: 'regenerate',
      parameters: { ...parameters, version },
      status: 'pending',
      runId
    });

    showServiceStarted('HuHu', 'regeneration');

    try {
      // Mock regeneration with slightly different processing time
      const result = await this.mockTwoStepGenerate(runId, parameters, version + 1);
      
      const duration = Date.now() - startTime;
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('HuHu', 'regeneration');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('HuHu', 'regeneration', errorMessage);
      
      throw error;
    }
  }

  /**
   * Validate HuHu API parameters
   */
  private validateParameters(parameters: HuHuParameters): void {
    if (!parameters.model_image) {
      throw new ValidationError('Model image is required');
    }

    if (!parameters.top_garment) {
      throw new ValidationError('Top garment image is required');
    }

    if (!parameters.bottom_garment) {
      throw new ValidationError('Bottom garment image is required');
    }

    // Validate model_type if provided
    if (parameters.model_type && !['SD_V1', 'SD_V2', 'SD_V3', 'HD'].includes(parameters.model_type)) {
      throw new ValidationError('Invalid model_type. Must be SD_V1, SD_V2, SD_V3, or HD');
    }

    // Check repaint_other_garment compatibility
    if (parameters.repaint_other_garment && parameters.model_type === 'HD') {
      throw new ValidationError('repaint_other_garment is not compatible with HD model_type');
    }

    // Validate image URLs (basic format check)
    const urlPattern = /\.(jpg|jpeg|png|webp)$/i;
    if (!urlPattern.test(parameters.model_image)) {
      throw new ValidationError('Model image must be a valid image file (jpg, png, webp)');
    }
    if (!urlPattern.test(parameters.top_garment)) {
      throw new ValidationError('Top garment must be a valid image file (jpg, png, webp)');
    }
    if (!urlPattern.test(parameters.bottom_garment)) {
      throw new ValidationError('Bottom garment must be a valid image file (jpg, png, webp)');
    }
  }

  /**
   * Mock HuHu AI two-step process
   * Step 1: Apply top garment to model
   * Step 2: Apply bottom garment to Step 1 result
   */
  private async mockTwoStepGenerate(
    runId: string,
    parameters: HuHuParameters,
    version = 1
  ): Promise<ServiceResult> {
    console.log(`[HuHu Mock] Starting two-step process for run ${runId}`);

    // Step 1: Apply top garment
    console.log('[HuHu Mock] Step 1: Applying top garment...');
    await this.simulateApiCall('Step 1 - Top garment', 2, 5); // Shortened for demo: 2-5 seconds
    
    // Simulate occasional Step 1 failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new ServiceError('Step 1 failed: Network timeout during top garment processing', 'huhu');
    }

    const step1Result = `/temp/huhu/${runId}_step1_${Date.now()}.png`;
    console.log(`[HuHu Mock] Step 1 completed. Intermediate result: ${step1Result}`);

    // Step 2: Apply bottom garment to Step 1 result  
    console.log('[HuHu Mock] Step 2: Applying bottom garment...');
    await this.simulateApiCall('Step 2 - Bottom garment', 2, 5); // Shortened for demo: 2-5 seconds

    // Simulate occasional Step 2 failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new ServiceError('Step 2 failed: Python script error during bottom garment processing', 'huhu');
    }

    const finalResult: ServiceResult = {
      id: `huhu_${runId}_v${version}_${Date.now()}`,
      service: 'huhu',
      runId,
      version,
      imagePath: `/static/results/${runId}/huhu/result_v${version}.jpg`,
      parameters,
      timestamp: new Date(),
      status: 'success'
    };

    console.log(`[HuHu Mock] Two-step process completed. Final result: ${finalResult.imagePath}`);
    return finalResult;
  }

  /**
   * Simulate API call with realistic processing time and potential failures
   */
  private async simulateApiCall(step: string, minSeconds: number, maxSeconds: number): Promise<void> {
    const processingTime = (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
    console.log(`[HuHu Mock] ${step} processing (estimated ${(processingTime/1000).toFixed(1)}s)...`);

    // Simulate network errors occasionally
    if (Math.random() < 0.02) { // 2% network error rate
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s then fail
      throw new ServiceError(`Network error during ${step}`, 'huhu');
    }

    // Simulate validation errors
    if (Math.random() < 0.02) { // 2% validation error rate
      throw new ValidationError(`Invalid image format detected in ${step}`);
    }

    await new Promise(resolve => setTimeout(resolve, processingTime));
  }

  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      service: 'huhu',
      name: 'HuHu AI',
      version: 'v1',
      endpoint: 'https://api-service.huhu.ai/tryon/v1',
      workflow: '2-step sequential',
      processingTime: '4-10 seconds (demo mode)', // In real mode: 80-160 seconds
      features: [
        'Two-step garment application',
        'SD_V1/V2/V3/HD model support',
        'Auto garment repainting',
        'Hand and foot repainting options'
      ],
      limitations: [
        'Requires VPS-hosted images',
        'Sequential processing only',
        'HD mode incompatible with repaint_other_garment'
      ]
    };
  }
}

// Export singleton instance
export const huhuManager = HuHuManager.getInstance();