// HuHu service controller - REAL API Integration (replacing Python scripts)
import { HuHuParameters, ServiceResult } from '@/lib/types/service';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';
import { historyLogger } from './history-logger';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';
import fs from 'fs/promises';
import path from 'path';

/**
 * HuHu Manager - Real API Integration for HuHu AI two-step try-on process
 * Replaces Python script execution with direct API calls
 */
export class HuHuManager {
  private static instance: HuHuManager;
  
  private serviceName = 'huhu';
  private apiKey = 'VWQ6F2yrew6Tzzu0uR7kB4MNzG2aCMg67gvyTgoO';
  private baseUrl = 'https://api-service.huhu.ai';
  
  // Polling configuration
  private maxPollingAttempts = 60; // 5 minutes max
  private pollingIntervalMs = 5000; // 5 seconds

  static getInstance(): HuHuManager {
    if (!HuHuManager.instance) {
      HuHuManager.instance = new HuHuManager();
    }
    return HuHuManager.instance;
  }

  /**
   * Generate full outfit using HuHu AI two-step process
   */
  async generate(runId: string, parameters: HuHuParameters): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: this.serviceName,
      action: 'generate',
      parameters,
      status: 'pending',
      runId
    });

    showServiceStarted('HUHU', 'generate');

    try {
      // Create results directory structure
      const resultsDir = await this.createResultsDirectory(runId);
      
      // Step 1: Apply top garment to original model
      console.log('[HuHu] Step 1: Processing top garment...');
      const topJobId = await this.submitJob(
        parameters.model_image,
        parameters.top_garment,
        'Top',
        parameters
      );
      
      const topResult = await this.pollJobStatus(topJobId);
      
      // Step 2: Apply bottom garment to step 1 result
      console.log('[HuHu] Step 2: Processing bottom garment...');
      const bottomJobId = await this.submitJob(
        topResult.imageUrl,
        parameters.bottom_garment,
        'Bottom',
        parameters
      );
      
      const finalResult = await this.pollJobStatus(bottomJobId);
      
      // Download final result to local storage
      const outputPath = path.join(resultsDir, `huhu_v1.png`);
      await this.downloadImage(finalResult.imageUrl, outputPath);
      
      const duration = Date.now() - startTime;
      const result: ServiceResult = {
        id: `huhu_${runId}_${Date.now()}`,
        service: 'huhu',
        runId,
        imagePath: `/api/results/${runId}/huhu_v1.png`,
        status: 'success',
        version: 1,
        timestamp: new Date(),
        parameters
      };

      // Mark as successful
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('HUHU', 'generate');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown HuHu service error';
      
      // Mark as failed
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('HUHU', 'generate', errorMessage);
      
      throw new ServiceError(`HuHu service error: ${errorMessage}`, this.serviceName);
    }
  }

  /**
   * Regenerate outfit with different parameters
   */
  async regenerate(runId: string, parameters: HuHuParameters, version = 1): Promise<ServiceResult> {
    const parametersWithVersion = { ...parameters, version: version + 1 };
    return this.generate(runId, parametersWithVersion);
  }

  /**
   * Submit a job to HuHu API and return job ID
   */
  private async submitJob(
    modelUrl: string,
    garmentUrl: string,
    garmentType: string,
    parameters: HuHuParameters
  ): Promise<string> {
    const payload = {
      image_garment_url: garmentUrl,
      image_model_url: modelUrl,
      garment_type: garmentType,
      model_type: 'SD_V2', // For optimal quality vs speed balance
      repaint_other_garment: parameters.repaint_other_garment || true, // Critical for outfit integration
      repaint_hands: parameters.repaint_hands || false,
      generate_matching_shoes: parameters.generate_matching_shoes || false
    };

    console.log(`[HuHu] Submitting job for ${garmentType} garment:`, payload);

    const response = await fetch(`${this.baseUrl}/tryon/v1`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Kozangen/1.0.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000) // 60 second timeout for submit
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuHu API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.job_id) {
      throw new Error('HuHu API did not return a job ID');
    }

    console.log(`[HuHu] Job submitted successfully: ${data.job_id}`);
    return data.job_id;
  }

  /**
   * Poll job status until completion and return result
   */
  private async pollJobStatus(jobId: string): Promise<{ imageUrl: string; status: string }> {
    console.log(`[HuHu] Polling job status: ${jobId}`);
    
    for (let attempt = 0; attempt < this.maxPollingAttempts; attempt++) {
      const response = await fetch(`${this.baseUrl}/requests/v1?job_id=${jobId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout for status check
      });

      if (!response.ok) {
        throw new Error(`HuHu status check failed (${response.status}): ${await response.text()}`);
      }

      const statusData = await response.json();
      console.log(`[HuHu] Job ${jobId} status: ${statusData.status}`);

      if (statusData.status === 'completed' && statusData.output && statusData.output.length > 0) {
        return {
          imageUrl: statusData.output[0].image_url,
          status: statusData.status
        };
      }

      if (statusData.status === 'failed') {
        throw new Error(`HuHu job failed: ${statusData.error || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollingIntervalMs));
    }

    throw new Error(`HuHu job ${jobId} timed out after ${this.maxPollingAttempts * this.pollingIntervalMs / 1000} seconds`);
  }

  /**
   * Download image from URL to local path
   */
  private async downloadImage(imageUrl: string, outputPath: string): Promise<void> {
    console.log(`[HuHu] Downloading result image to: ${outputPath}`);
    
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`Failed to download HuHu result image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
    
    console.log(`[HuHu] Image downloaded successfully: ${outputPath}`);
  }

  /**
   * Create results directory structure
   */
  private async createResultsDirectory(runId: string): Promise<string> {
    const resultsDir = path.join(process.cwd(), 'data', 'results', runId);
    await fs.mkdir(resultsDir, { recursive: true });
    return resultsDir;
  }

  /**
   * Validate HuHu API parameters
   */
  private validateParameters(parameters: HuHuParameters): void {
    if (!parameters.model_image) {
      throw new ValidationError('model_image parameter is required', this.serviceName);
    }
    
    if (!parameters.top_garment) {
      throw new ValidationError('top_garment parameter is required', this.serviceName);
    }
    
    if (!parameters.bottom_garment) {
      throw new ValidationError('bottom_garment parameter is required', this.serviceName);
    }

    // Validate image file formats (should be URLs)
    const urlPattern = /^https?:\/\/.+/i;
    
    if (!urlPattern.test(parameters.model_image)) {
      throw new ValidationError('model_image must be a valid URL', this.serviceName);
    }
    
    if (!urlPattern.test(parameters.top_garment)) {
      throw new ValidationError('top_garment must be a valid URL', this.serviceName);
    }
    
    if (!urlPattern.test(parameters.bottom_garment)) {
      throw new ValidationError('bottom_garment must be a valid URL', this.serviceName);
    }
  }

  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      service: 'huhu',
      name: 'HuHu AI',
      version: 'v1.0',
      workflow: 'Two-step sequential processing (Top → Bottom)',
      processingTime: 'Estimated 15-30 seconds per generation',
      features: [
        'Two-step outfit application',
        'High-quality garment fitting',
        'Real-time job polling',
        'Direct API integration',
        'Automatic image download'
      ],
      limitations: [
        'Requires high-quality input images',
        'Processing time varies with image complexity',
        'Single outfit per generation'
      ],
      status: 'active',
      baseUrl: this.baseUrl
    };
  }
}

// Export singleton instance
export const huhuManager = HuHuManager.getInstance();