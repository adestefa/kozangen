// FASHN service controller - Refactored with base class
import { FashnParameters, ServiceResult } from '@/lib/types/service';
import { ValidationError } from '@/lib/utils/error-handler';
import { BaseServiceManager } from './base-service-manager';

/**
 * FASHN Manager - Real Python script execution for FASHN AI two-step try-on process
 * Refactored to use BaseServiceManager for common functionality
 */
export class FashnManager extends BaseServiceManager {
  private static instance: FashnManager;
  
  protected serviceName = 'fashn';
  protected scriptPath = '/opt/python_scripts/fashn/test_job.py';

  static getInstance(): FashnManager {
    if (!FashnManager.instance) {
      FashnManager.instance = new FashnManager();
    }
    return FashnManager.instance;
  }

  /**
   * Generate full outfit using FASHN AI two-step process
   */
  async generate(runId: string, parameters: FashnParameters): Promise<ServiceResult> {
    return this.executePythonScript(runId, parameters, 'generate');
  }

  /**
   * Regenerate outfit with different parameters
   */
  async regenerate(runId: string, parameters: FashnParameters, version = 1): Promise<ServiceResult> {
    const parametersWithVersion = { ...parameters, version };
    return this.executePythonScript(runId, parametersWithVersion, 'regenerate');
  }

  /**
   * Validate FASHN API parameters
   */
  protected validateParameters(parameters: FashnParameters): void {
    this.validateRequiredParam(parameters.person_image, 'person_image');
    this.validateRequiredParam(parameters.top_garment, 'top_garment');
    this.validateRequiredParam(parameters.bottom_garment, 'bottom_garment');

    // Validate image file formats
    const filePattern = /\.(jpg|jpeg|png|webp)$/i;
    this.validateImageFormat(parameters.person_image, 'person_image', filePattern);
    this.validateImageFormat(parameters.top_garment, 'top_garment', filePattern);
    this.validateImageFormat(parameters.bottom_garment, 'bottom_garment', filePattern);
  }

  /**
   * Build script arguments for Python execution
   */
  protected buildScriptArgs(runId: string, parameters: FashnParameters): string[] {
    const version = (parameters as FashnParameters & { version?: number }).version || 1;
    return [
      runId,
      parameters.person_image,
      parameters.top_garment,
      parameters.bottom_garment,
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
      const expectedPath = `/static/results/${runId}/fashn/result_v${version}.jpg`;
      
      return {
        id: `fashn_${runId}_v${version}_${Date.now()}`,
        service: 'fashn',
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
      service: 'fashn',
      name: 'FASHN AI',
      version: 'v1',
      scriptPath: this.scriptPath,
      workflow: 'Python script execution - two-step process',
      processingTime: 'Depends on Python script execution time',
      features: [
        'Real Python script execution',
        'Two-step processing (top then bottom)',
        'High-quality person modeling',
        'Garment fitting and draping',
        'Sequential garment application'
      ],
      limitations: [
        'Requires Python script at /opt/python_scripts/fashn/',
        'Depends on system Python3 installation',
        'Processing time varies by system resources',
        'Two-step process may take longer'
      ],
      execution: {
        command: 'python3',
        scriptPath: this.scriptPath,
        timeout: 'No timeout (depends on script)',
        errorHandling: 'Exit code and stderr monitoring'
      },
      uniqueFeatures: [
        'Two-step garment application',
        'Person-centric approach',
        'Sequential processing workflow',
        'Natural garment draping'
      ]
    };
  }

  /**
   * Get processing estimate based on parameters
   */
  getProcessingEstimate(parameters: FashnParameters): { estimatedSeconds: number; factors: string[] } {
    const factors: string[] = [
      'Real Python script execution',
      'Two-step processing (top then bottom garments)'
    ];

    return {
      estimatedSeconds: 0, // Unknown - depends on Python script performance
      factors
    };
  }
}

// Export singleton instance
export const fashnManager = FashnManager.getInstance();