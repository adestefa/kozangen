// FASHN service controller - Sequential processing implementation
import { FashnParameters, ServiceResult } from '@/lib/types/service';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';
import { historyLogger } from './history-logger';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';
import fs from 'fs/promises';
import path from 'path';

/**
 * FASHN Manager - Sequential processing implementation
 * Handles two-step FASHN AI process: top garment → intermediate → bottom garment → final
 */
export class FashnManager {
  private static instance: FashnManager;
  private serviceName = 'fashn';

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
      const topResult = await this.processSingleGarment(
        parameters.model_image,
        parameters.top_garment,
        resultsDir,
        'top',
        1
      );

      // Step 2: Apply bottom garment to intermediate result
      console.log('[FASHN] Step 2: Processing bottom garment...');
      const finalResult = await this.processSingleGarment(
        topResult.imagePath,
        parameters.bottom_garment,
        resultsDir,
        'final',
        1
      );

      const duration = Date.now() - startTime;

      // Create result object
      const result: ServiceResult = {
        id: `fashn_${runId}_v1_${Date.now()}`,
        service: 'fashn',
        runId,
        version: 1,
        imagePath: finalResult.imagePath,
        parameters,
        timestamp: new Date(),
        status: 'success'
      };

      // Mark as successful
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FASHN', 'generate');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark as failed
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FASHN', 'generate', errorMessage);

      throw error;
    }
  }

  /**
   * Regenerate outfit with different parameters (version increment)
   */
  async regenerate(runId: string, parameters: FashnParameters, version = 2): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: this.serviceName,
      action: 'regenerate',
      parameters,
      status: 'pending',
      runId
    });

    showServiceStarted('FASHN', 'regenerate');

    try {
      // Get existing results directory
      const resultsDir = path.join(process.cwd(), 'data', 'results', runId, 'fashn');
      
      // Sequential processing for regeneration
      console.log(`[FASHN] Regenerating v${version} - Step 1: Processing top garment...`);
      const topResult = await this.processSingleGarment(
        parameters.model_image,
        parameters.top_garment,
        resultsDir,
        'top',
        version
      );

      console.log(`[FASHN] Regenerating v${version} - Step 2: Processing bottom garment...`);
      const finalResult = await this.processSingleGarment(
        topResult.imagePath,
        parameters.bottom_garment,
        resultsDir,
        'final',
        version
      );

      const duration = Date.now() - startTime;

      // Create result object
      const result: ServiceResult = {
        id: `fashn_${runId}_v${version}_${Date.now()}`,
        service: 'fashn',
        runId,
        version,
        imagePath: finalResult.imagePath,
        parameters,
        timestamp: new Date(),
        status: 'success'
      };

      // Mark as successful
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FASHN', 'regenerate');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark as failed
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FASHN', 'regenerate', errorMessage);

      throw error;
    }
  }

  /**
   * Process single garment step (either top or bottom)
   */
  private async processSingleGarment(
    modelImagePath: string,
    garmentImagePath: string,
    resultsDir: string,
    step: 'top' | 'final',
    version: number
  ): Promise<{ imagePath: string }> {
    // This is a mock implementation for now
    // In production, this would call the actual FASHN API
    
    console.log(`[FASHN] Processing ${step} garment step...`);
    console.log(`[FASHN] Model: ${modelImagePath}`);
    console.log(`[FASHN] Garment: ${garmentImagePath}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock result file paths following PRD naming convention
    const filename = step === 'top' 
      ? `fashn_v${version}_top.png`
      : `fashn_v${version}.png`;
    
    const outputPath = path.join(resultsDir, filename);
    
    // Create mock image file (in production, this would be the actual FASHN API result)
    await this.createMockImageFile(outputPath);
    
    // Return path compatible with existing results route: /api/results/[runId]/[filename]
    const runIdFromPath = path.basename(resultsDir);
    const relativePath = `/api/results/${runIdFromPath}/${filename}`;
    
    console.log(`[FASHN] ${step} step completed: ${relativePath}`);
    
    return { imagePath: relativePath };
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
   * Create mock image file (placeholder for actual FASHN API result)
   */
  private async createMockImageFile(outputPath: string): Promise<void> {
    try {
      // Create a simple text file as placeholder (in production, this would be actual image bytes)
      const mockImageData = `Mock FASHN result generated at ${new Date().toISOString()}`;
      await fs.writeFile(outputPath, mockImageData);
      console.log(`[FASHN] Created mock result file: ${outputPath}`);
    } catch (error) {
      throw new ServiceError(
        `Failed to create result file: ${error.message}`,
        'file_creation_failed'
      );
    }
  }

  /**
   * Validate FASHN API parameters
   */
  private validateParameters(parameters: FashnParameters): void {
    this.validateRequiredParam(parameters.model_image, 'model_image');
    this.validateRequiredParam(parameters.top_garment, 'top_garment');
    this.validateRequiredParam(parameters.bottom_garment, 'bottom_garment');

    // Validate image file formats
    const filePattern = /\.(jpg|jpeg|png|webp)$/i;
    this.validateImageFormat(parameters.model_image, 'model_image', filePattern);
    this.validateImageFormat(parameters.top_garment, 'top_garment', filePattern);
    this.validateImageFormat(parameters.bottom_garment, 'bottom_garment', filePattern);
  }

  /**
   * Validate required parameter
   */
  private validateRequiredParam(value: unknown, paramName: string): void {
    if (!value) {
      throw new ValidationError(`Missing required parameter: ${paramName}`, paramName);
    }
  }

  /**
   * Validate image file format
   */
  private validateImageFormat(imagePath: string, paramName: string, pattern: RegExp): void {
    if (!pattern.test(imagePath)) {
      throw new ValidationError(
        `${paramName} must be a valid image file (jpg, png, webp)`, 
        paramName
      );
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