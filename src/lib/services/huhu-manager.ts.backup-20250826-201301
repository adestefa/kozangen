// HuHu service controller - Refactored with base class
import { HuHuParameters, ServiceResult } from '@/lib/types/service';
import { ValidationError } from '@/lib/utils/error-handler';
import { BaseServiceManager } from './base-service-manager';

/**
 * HuHu Manager - Real Python script execution for HuHu AI two-step try-on process
 * Refactored to use BaseServiceManager for common functionality
 */
export class HuHuManager extends BaseServiceManager {
  private static instance: HuHuManager;
  
  protected serviceName = 'huhu';
  protected scriptPath = '/opt/python_scripts/huhu/test_job.py';

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
    return this.executePythonScript(runId, parameters, 'generate');
  }

  /**
   * Regenerate outfit with different parameters
   */
  async regenerate(runId: string, parameters: HuHuParameters, version = 1): Promise<ServiceResult> {
    const parametersWithVersion = { ...parameters, version };
    return this.executePythonScript(runId, parametersWithVersion, 'regenerate');
  }

  /**
   * Validate HuHu API parameters
   */
  protected validateParameters(parameters: HuHuParameters): void {
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
  protected buildScriptArgs(runId: string, parameters: HuHuParameters): string[] {
    const version = (parameters as HuHuParameters & { version?: number }).version || 1;
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
      const expectedPath = `/static/results/${runId}/huhu/result_v${version}.jpg`;
      
      return {
        id: `huhu_${runId}_v${version}_${Date.now()}`,
        service: 'huhu',
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
      service: 'huhu',
      name: 'HuHu AI',
      version: 'v1',
      scriptPath: this.scriptPath,
      workflow: 'Python script execution - two-step process',
      processingTime: 'Depends on Python script execution time',
      features: [
        'Real Python script execution',
        'Two-step processing (top then bottom)',
        'Advanced person modeling',
        'Garment fitting technology',
        'High-quality rendering'
      ],
      limitations: [
        'Requires Python script at /opt/python_scripts/huhu/',
        'Depends on system Python3 installation',
        'Processing time varies by system resources',
        'Two-step sequential process'
      ],
      execution: {
        command: 'python3',
        scriptPath: this.scriptPath,
        timeout: 'No timeout (depends on script)',
        errorHandling: 'Exit code and stderr monitoring'
      },
      uniqueFeatures: [
        'Advanced AI modeling',
        'Two-step garment processing',
        'High-fidelity results',
        'Person-centric workflow'
      ]
    };
  }

  /**
   * Get processing estimate based on parameters
   */
  getProcessingEstimate(parameters: HuHuParameters): { estimatedSeconds: number; factors: string[] } {
    const factors: string[] = [
      'Real Python script execution',
      'Two-step processing (sequential garment application)'
    ];

    return {
      estimatedSeconds: 0, // Unknown - depends on Python script performance
      factors
    };
  }
}

// Export singleton instance
export const huhuManager = HuHuManager.getInstance();