// FitRoom service controller - Refactored with base class
import { FitRoomParameters, ServiceResult } from '@/lib/types/service';
import { ValidationError } from '@/lib/utils/error-handler';
import { BaseServiceManager } from './base-service-manager';

/**
 * FitRoom Manager - Real Python script execution for FitRoom AI combo try-on process
 * Refactored to use BaseServiceManager for common functionality
 */
export class FitRoomManager extends BaseServiceManager {
  private static instance: FitRoomManager;
  
  protected serviceName = 'fitroom';
  protected scriptPath = '/opt/python_scripts/fitroom/test_job.py';

  static getInstance(): FitRoomManager {
    if (!FitRoomManager.instance) {
      FitRoomManager.instance = new FitRoomManager();
    }
    return FitRoomManager.instance;
  }

  /**
   * Generate full outfit using FitRoom combo process
   */
  async generate(runId: string, parameters: FitRoomParameters): Promise<ServiceResult> {
    return this.executePythonScript(runId, parameters, 'generate');
  }

  /**
   * Regenerate outfit with different parameters
   */
  async regenerate(runId: string, parameters: FitRoomParameters, version = 1): Promise<ServiceResult> {
    const parametersWithVersion = { ...parameters, version };
    return this.executePythonScript(runId, parametersWithVersion, 'regenerate');
  }

  /**
   * Validate FitRoom API parameters
   */
  protected validateParameters(parameters: FitRoomParameters): void {
    this.validateRequiredParam(parameters.model_image, 'model_image');
    this.validateRequiredParam(parameters.top_garment, 'top_garment');
    this.validateRequiredParam(parameters.bottom_garment, 'bottom_garment');

    // Validate cloth_type if provided
    if (parameters.cloth_type && parameters.cloth_type !== 'combo') {
      throw new ValidationError('cloth_type must be "combo" for full outfit generation', 'cloth_type');
    }

    // Validate image file formats
    const filePattern = /\.(jpg|jpeg|png|webp)$/i;
    this.validateImageFormat(parameters.model_image, 'model_image', filePattern);
    this.validateImageFormat(parameters.top_garment, 'top_garment', filePattern);
    this.validateImageFormat(parameters.bottom_garment, 'bottom_garment', filePattern);
  }

  /**
   * Build script arguments for Python execution
   */
  protected buildScriptArgs(runId: string, parameters: FitRoomParameters): string[] {
    const version = (parameters as FitRoomParameters & { version?: number }).version || 1;
    return [
      runId,
      parameters.model_image,
      parameters.top_garment,
      parameters.bottom_garment,
      '--cloth-type', parameters.cloth_type || 'combo',
      '--hd-mode', String(parameters.hd_mode || true),
      '--version', String(version)
    ];
  }

  /**
   * Parse Python script result
   */
  protected parseResult(stdout: string, runId: string): ServiceResult {
    const version = 1; // Default version for result parsing
    
    try {
      // Try to parse from stdout output or create expected path
      const expectedPath = `/static/results/${runId}/fitroom/result_v${version}.jpg`;
      
      return {
        id: `fitroom_${runId}_v${version}_${Date.now()}`,
        service: 'fitroom',
        runId,
        version,
        imagePath: expectedPath,
        parameters: {},
        timestamp: new Date(),
        status: 'success'
      };
    } catch (error) {
      return this.parseImageResult(stdout, runId);
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
      service: 'fitroom',
      name: 'FitRoom AI',
      version: 'v2',
      scriptPath: this.scriptPath,
      workflow: 'Python script execution with child_process.spawn',
      processingTime: 'Depends on Python script execution time',
      features: [
        'Real Python script execution',
        'Single combo outfit processing',
        'HD mode support',
        'Full outfit in one script execution',
        'High-quality rendering'
      ],
      limitations: [
        'Requires Python script at /opt/python_scripts/fitroom/',
        'Depends on system Python3 installation',
        'Processing time varies by system resources',
        'Memory intensive processing'
      ],
      execution: {
        command: 'python3',
        scriptPath: this.scriptPath,
        timeout: 'No timeout (depends on script)',
        errorHandling: 'Exit code and stderr monitoring'
      },
      uniqueFeatures: [
        'Real Python script execution',
        'Combo approach processing',
        'Single execution for full outfit',
        'HD mode parameter support'
      ]
    };
  }

  /**
   * Get processing estimate based on parameters
   */
  getProcessingEstimate(parameters: FitRoomParameters): { estimatedSeconds: number; factors: string[] } {
    const factors: string[] = ['Real Python script execution'];

    if (parameters.hd_mode) {
      factors.push('HD mode (may increase processing time)');
    }

    return {
      estimatedSeconds: 0, // Unknown - depends on Python script performance
      factors
    };
  }
}

// Export singleton instance
export const fitroomManager = FitRoomManager.getInstance();