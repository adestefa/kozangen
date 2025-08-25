// FASHN service controller - Mock implementation simulating FASHN AI API v1.6 workflow
import { FashnParameters, ServiceResult } from '@/lib/types/service';
import { historyLogger } from './history-logger';
import { ServiceError, ValidationError } from '@/lib/utils/error-handler';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';

/**
 * FASHN Manager - Simulates FASHN AI two-step try-on process
 * Step 1: Apply top garment to original model
 * Step 2: Apply bottom garment to Step 1 result
 * 
 * Simulates: POST https://api.fashn.ai/v1/run (twice)
 * Processing time: 5-17 seconds per step (10-34 seconds total)
 */
export class FashnManager {
  private static instance: FashnManager;

  static getInstance(): FashnManager {
    if (!FashnManager.instance) {
      FashnManager.instance = new FashnManager();
    }
    return FashnManager.instance;
  }

  /**
   * Generate full outfit using FASHN AI two-step process (mock)
   * Simulates: POST https://api.fashn.ai/v1/run (twice)
   */
  async generate(
    runId: string,
    parameters: FashnParameters
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: 'fashn',
      action: 'generate',
      parameters,
      status: 'pending',
      runId
    });

    showServiceStarted('FASHN', 'generation');

    try {
      // Mock two-step generation process
      const result = await this.mockTwoStepGenerate(runId, parameters);
      
      const duration = Date.now() - startTime;
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FASHN', 'generation');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FASHN', 'generation', errorMessage);
      
      throw error;
    }
  }

  /**
   * Regenerate outfit with different parameters (mock)
   */
  async regenerate(
    runId: string,
    parameters: FashnParameters,
    version = 1
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: 'fashn',
      action: 'regenerate',
      parameters: { ...parameters, version },
      status: 'pending',
      runId
    });

    showServiceStarted('FASHN', 'regeneration');

    try {
      // Mock regeneration with slightly different processing
      const result = await this.mockTwoStepGenerate(runId, parameters, version + 1);
      
      const duration = Date.now() - startTime;
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FASHN', 'regeneration');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FASHN', 'regeneration', errorMessage);
      
      throw error;
    }
  }

  /**
   * Validate FASHN API parameters
   */
  private validateParameters(parameters: FashnParameters): void {
    if (!parameters.model_image) {
      throw new ValidationError('Model image is required');
    }

    if (!parameters.top_garment) {
      throw new ValidationError('Top garment image is required');
    }

    if (!parameters.bottom_garment) {
      throw new ValidationError('Bottom garment image is required');
    }

    // Validate mode if provided
    if (parameters.mode && !['performance', 'balanced', 'quality'].includes(parameters.mode)) {
      throw new ValidationError('Invalid mode. Must be performance, balanced, or quality');
    }

    // Validate category if provided
    if (parameters.category && !['auto', 'tops', 'bottoms', 'one-pieces'].includes(parameters.category)) {
      throw new ValidationError('Invalid category. Must be auto, tops, bottoms, or one-pieces');
    }

    // Validate seed if provided
    if (parameters.seed !== undefined && (parameters.seed < 0 || parameters.seed > 4294967295)) {
      throw new ValidationError('Seed must be between 0 and 4294967295');
    }

    // Validate num_samples if provided
    if (parameters.num_samples && (parameters.num_samples < 1 || parameters.num_samples > 4)) {
      throw new ValidationError('num_samples must be between 1 and 4');
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
   * Mock FASHN AI two-step process
   * Step 1: Apply top garment to model
   * Step 2: Apply bottom garment to Step 1 result
   */
  private async mockTwoStepGenerate(
    runId: string,
    parameters: FashnParameters,
    version = 1
  ): Promise<ServiceResult> {
    console.log(`[FASHN Mock] Starting two-step process for run ${runId}`);
    const mode = parameters.mode || 'balanced';

    // Step 1: Apply top garment
    console.log('[FASHN Mock] Step 1: Applying top garment...');
    const step1Time = this.getModeProcessingTime(mode);
    await this.simulateApiCall('Step 1 - Top garment', step1Time.min, step1Time.max);
    
    // Simulate Step 1 status polling (FASHN uses prediction IDs)
    await this.simulateStatusPolling('Step 1', mode);

    // Simulate occasional Step 1 failures
    if (Math.random() < 0.03) { // 3% failure rate
      throw new ServiceError('Step 1 failed: API rate limit exceeded', 'fashn');
    }

    const step1PredictionId = `pred_${Date.now()}_step1`;
    console.log(`[FASHN Mock] Step 1 completed. Prediction ID: ${step1PredictionId}`);

    // Step 2: Apply bottom garment to Step 1 result
    console.log('[FASHN Mock] Step 2: Applying bottom garment...');
    const step2Time = this.getModeProcessingTime(mode);
    await this.simulateApiCall('Step 2 - Bottom garment', step2Time.min, step2Time.max);
    
    // Simulate Step 2 status polling
    await this.simulateStatusPolling('Step 2', mode);

    // Simulate occasional Step 2 failures
    if (Math.random() < 0.03) { // 3% failure rate
      throw new ServiceError('Step 2 failed: Model rendering error in quality mode', 'fashn');
    }

    const finalResult: ServiceResult = {
      id: `fashn_${runId}_v${version}_${Date.now()}`,
      service: 'fashn',
      runId,
      version,
      imagePath: `/static/results/${runId}/fashn/result_v${version}.png`,
      parameters,
      timestamp: new Date(),
      status: 'success'
    };

    console.log(`[FASHN Mock] Two-step process completed. Final result: ${finalResult.imagePath}`);
    return finalResult;
  }

  /**
   * Get processing time based on FASHN mode
   */
  private getModeProcessingTime(mode: string): { min: number; max: number } {
    switch (mode) {
      case 'performance':
        return { min: 1, max: 2 }; // Demo: 1-2 seconds (real: 5 seconds)
      case 'quality':
        return { min: 3, max: 5 }; // Demo: 3-5 seconds (real: 12-17 seconds)
      case 'balanced':
      default:
        return { min: 2, max: 3 }; // Demo: 2-3 seconds (real: 8-9 seconds)
    }
  }

  /**
   * Simulate FASHN status polling (starting -> in_queue -> processing -> completed)
   */
  private async simulateStatusPolling(step: string, _mode: string): Promise<void> {
    console.log(`[FASHN Mock] ${step}: starting -> in_queue -> processing...`);
    
    // Simulate queue time (varies by load)
    const queueTime = Math.random() * 1000; // 0-1 second in demo mode
    await new Promise(resolve => setTimeout(resolve, queueTime));
    
    console.log(`[FASHN Mock] ${step}: processing -> completed`);
  }

  /**
   * Simulate API call with realistic processing time and potential failures
   */
  private async simulateApiCall(step: string, minSeconds: number, maxSeconds: number): Promise<void> {
    const processingTime = (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
    console.log(`[FASHN Mock] ${step} processing (estimated ${(processingTime/1000).toFixed(1)}s)...`);

    // Simulate rate limit errors (FASHN has 50 requests/60 seconds)
    if (Math.random() < 0.01) { // 1% rate limit error
      throw new ServiceError(`Rate limit exceeded during ${step}. Retry after 60 seconds`, 'fashn');
    }

    // Simulate network errors
    if (Math.random() < 0.01) { // 1% network error rate
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s then fail
      throw new ServiceError(`Network timeout during ${step}`, 'fashn');
    }

    // Simulate API authentication errors
    if (Math.random() < 0.005) { // 0.5% auth error rate
      throw new ServiceError(`Invalid API key for ${step}`, 'fashn');
    }

    await new Promise(resolve => setTimeout(resolve, processingTime));
  }

  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      service: 'fashn',
      name: 'FASHN AI',
      version: 'v1.6',
      endpoint: 'https://api.fashn.ai/v1',
      workflow: '2-step sequential with prediction polling',
      processingTime: '4-8 seconds (demo mode)', // In real mode: 10-34 seconds
      features: [
        'Two-step garment application',
        'Performance/Balanced/Quality modes',
        'Automatic garment categorization',
        'Seed-based reproducibility',
        'Multiple sample generation'
      ],
      limitations: [
        'Requires URL-hosted images (no base64)',
        'Rate limit: 50 requests per 60 seconds',
        'Concurrent limit: 6 requests max',
        'CDN URLs expire after 72 hours'
      ],
      rateLimits: {
        run: '50 requests per 60 seconds',
        status: '50 requests per 10 seconds',
        concurrent: '6 requests maximum'
      }
    };
  }
}

// Export singleton instance
export const fashnManager = FashnManager.getInstance();