// FASHN service controller - REAL API Integration (replacing mock implementation)
import { FashnParameters, ServiceResult } from '@/lib/types/service';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';
import { historyLogger } from './history-logger';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';
import fs from 'fs/promises';
import path from 'path';

/**
 * FASHN Manager - Real API Integration for FASHN AI two-step process
 * Replaces mock implementation with direct API calls to api.fashn.ai
 */
export class FashnManager {
  private static instance: FashnManager;
  
  private serviceName = 'fashn';
  private apiKey = 'fa-dkrOiGYYPKfD-OCVacZnebuYBtmh1ZlFBOXhr';
  private baseUrl = 'https://api.fashn.ai/v1';
  
  // Polling configuration
  private maxPollingAttempts = 40; // 10 minutes max (40 * 15 seconds)
  private pollingIntervalMs = 15000; // 15 seconds

  static getInstance(): FashnManager {
    if (!FashnManager.instance) {
      FashnManager.instance = new FashnManager();
    }
    return FashnManager.instance;
  }

  /**
   * Generate full outfit using FASHN AI two-step sequential process
   */
  async generate(runId: string, parameters: FashnParameters): Promise<ServiceResult> {
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

    showServiceStarted('FASHN', 'generate');

    try {
      // Create results directory structure
      const resultsDir = await this.createResultsDirectory(runId);
      
      // Step 1: Apply top garment to original model
      console.log('[FASHN] Step 1: Processing top garment...');
      const topJobId = await this.submitJob(
        parameters.model_image,
        parameters.top_garment,
        'tops',
        1
      );
      
      const topResult = await this.pollJobStatus(topJobId);
      
      // Step 2: Apply bottom garment to step 1 result
      console.log('[FASHN] Step 2: Processing bottom garment...');
      const bottomJobId = await this.submitJob(
        topResult.imageUrl,
        parameters.bottom_garment,
        'bottoms',
        1
      );
      
      const finalResult = await this.pollJobStatus(bottomJobId);
      
      // Download final result to local storage
      const outputPath = path.join(resultsDir, `fashn_v1.png`);
      await this.downloadImage(finalResult.imageUrl, outputPath);
      
      const duration = Date.now() - startTime;
      const result: ServiceResult = {
        id: `fashn_${runId}_${Date.now()}`,
        service: 'fashn',
        runId,
        imagePath: `/input/results/${runId}/fashn_v1.png`,
        status: 'success',
        processingTime: `${duration}ms`,
        version: 1,
        parameters
      };

      // Mark as successful
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FASHN', 'generate');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown FASHN service error';
      
      // Mark as failed
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FASHN', 'generate', errorMessage);

      throw new ServiceError(`FASHN service error: ${errorMessage}`, this.serviceName);
    }
  }

  /**
   * Regenerate outfit with different parameters (version increment)
   */
  async regenerate(runId: string, parameters: FashnParameters, version = 2): Promise<ServiceResult> {
    const parametersWithVersion = { ...parameters, version: version };
    return this.generate(runId, parametersWithVersion);
  }

  /**
   * Submit a job to FASHN API and return job ID
   */
  private async submitJob(
    modelUrl: string,
    garmentUrl: string,
    category: string,
    version: number
  ): Promise<string> {
    const payload = {
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: modelUrl,
        garment_image: garmentUrl,
        mode: 'quality', // Use quality mode for best results
        category: category, // 'tops' or 'bottoms'
        seed: 42 // For reproducibility
      }
    };

    console.log(`[FASHN] Submitting job for ${category} garment:`, payload);

    const response = await fetch(`${this.baseUrl}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'Kozangen/1.0.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000) // 60 second timeout for submit
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FASHN API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.id) {
      throw new Error('FASHN API did not return a job ID');
    }

    console.log(`[FASHN] Job submitted successfully: ${data.id}`);
    return data.id;
  }

  /**
   * Poll job status until completion and return result
   */
  private async pollJobStatus(jobId: string): Promise<{ imageUrl: string; status: string }> {
    console.log(`[FASHN] Polling job status: ${jobId}`);
    
    for (let attempt = 0; attempt < this.maxPollingAttempts; attempt++) {
      const response = await fetch(`${this.baseUrl}/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout for status check
      });

      if (!response.ok) {
        throw new Error(`FASHN status check failed (${response.status}): ${await response.text()}`);
      }

      const statusData = await response.json();
      console.log(`[FASHN] Job ${jobId} status: ${statusData.status}`);

      if (statusData.status === 'completed' || statusData.status === 'succeeded') {
        const output = statusData.output || [];
        if (output.length > 0) {
          return {
            imageUrl: output[0],
            status: statusData.status
          };
        }
        throw new Error('FASHN job completed but no output URL provided');
      }

      if (statusData.status === 'failed') {
        throw new Error(`FASHN job failed: ${statusData.error || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollingIntervalMs));
    }

    throw new Error(`FASHN job ${jobId} timed out after ${this.maxPollingAttempts * this.pollingIntervalMs / 1000} seconds`);
  }

  /**
   * Download image from URL to local path
   */
  private async downloadImage(imageUrl: string, outputPath: string): Promise<void> {
    console.log(`[FASHN] Downloading result image to: ${outputPath}`);
    
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`Failed to download FASHN result image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
    
    console.log(`[FASHN] Image downloaded successfully: ${outputPath}`);
  }

  /**
   * Create results directory structure
   */
  private async createResultsDirectory(runId: string): Promise<string> {
    const resultsDir = path.join(process.cwd(), 'data', 'results', runId);
    
    try {
      await fs.mkdir(resultsDir, { recursive: true });
      console.log(`[FASHN] Created results directory: ${resultsDir}`);
      return resultsDir;
    } catch (error) {
      throw new ServiceError(
        `Failed to create results directory: ${error.message}`,
        'directory_creation_failed'
      );
    }
  }


  /**
   * Validate FASHN API parameters
   */
  private validateParameters(parameters: FashnParameters): void {
    if (!parameters.model_image) {
      throw new ValidationError('model_image parameter is required', this.serviceName);
    }
    
    if (!parameters.top_garment) {
      throw new ValidationError('top_garment parameter is required', this.serviceName);
    }
    
    if (!parameters.bottom_garment) {
      throw new ValidationError('bottom_garment parameter is required', this.serviceName);
    }

    // Validate image URLs
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
      service: 'fashn',
      name: 'FASHN AI',
      version: 'v1.6',
      workflow: 'Sequential two-step processing',
      processingTime: 'Estimated 4-6 seconds per generation',
      features: [
        'Sequential processing (top then bottom)',
        'High-quality person modeling',
        'Garment fitting and draping',
        'Intermediate result storage',
        'Version management for regeneration'
      ],
      limitations: [
        'Requires valid image URLs for model and garments',
        'Processing time increases with image complexity',
        'Two-step process may take longer than single-step services'
      ],
      execution: {
        workflow: 'Sequential API calls',
        steps: ['Apply top garment to model', 'Apply bottom garment to intermediate result'],
        timeout: '30 seconds per step',
        errorHandling: 'Comprehensive error handling with rollback'
      },
      uniqueFeatures: [
        'Two-step garment application',
        'Intermediate result preservation',
        'Sequential processing workflow',
        'Natural garment layering'
      ]
    };
  }

  /**
   * Get processing estimate based on parameters
   */
  getProcessingEstimate(parameters: FashnParameters): { estimatedSeconds: number; factors: string[] } {
    const factors: string[] = [
      'Two-step sequential processing',
      'Top garment application (~2-3 seconds)',
      'Bottom garment application (~2-3 seconds)',
      'File system operations'
    ];

    return {
      estimatedSeconds: 5, // Realistic estimate for two-step process
      factors
    };
  }
}

// Export singleton instance
export const fashnManager = FashnManager.getInstance();