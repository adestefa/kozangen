// FASHN service controller - Real Python script execution implementation
import { FashnParameters, ServiceResult } from '@/lib/types/service';
import { historyLogger } from './history-logger';
import { ServiceError, ValidationError } from '@/lib/utils/error-handler';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';
import { spawn } from 'child_process';
import path from 'path';

/**
 * FASHN Manager - Real Python script execution for FASHN AI two-step try-on process
 * Step 1: Apply top garment to original model
 * Step 2: Apply bottom garment to Step 1 result
 * 
 * Executes: /opt/python_scripts/fashn/test_job.py
 * Processing time: Real processing time depends on Python script execution
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
   * Generate full outfit using FASHN AI two-step process (real Python execution)
   * Executes: /opt/python_scripts/fashn/test_job.py
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
      // Execute real Python script for FASHN generation
      const result = await this.executePythonScript(runId, parameters);
      
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
   * Regenerate outfit with different parameters (real Python execution)
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
      // Execute real Python script for FASHN regeneration
      const result = await this.executePythonScript(runId, parameters, version + 1);
      
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
   * Execute real Python script for FASHN AI two-step process
   * Calls the Python script at /opt/python_scripts/fashn/test_job.py
   */
  private async executePythonScript(
    runId: string,
    parameters: FashnParameters,
    version = 1
  ): Promise<ServiceResult> {
    console.log(`[FASHN] Starting Python script execution for run ${runId}`);

    const scriptPath = '/opt/python_scripts/fashn/test_job.py';
    
    // Prepare arguments for Python script
    const args = [
      scriptPath,
      runId,
      parameters.model_image,
      parameters.top_garment,
      parameters.bottom_garment,
      '--mode', parameters.mode || 'balanced',
      '--category', parameters.category || 'auto',
      '--seed', String(parameters.seed || 0),
      '--num-samples', String(parameters.num_samples || 1),
      '--version', String(version)
    ];

    console.log(`[FASHN] Executing: python3 ${args.join(' ')}`);

    return new Promise<ServiceResult>((resolve, reject) => {
      const pythonProcess = spawn('python3', args, {
        cwd: path.dirname(scriptPath),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`[FASHN stdout]:`, data.toString().trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`[FASHN stderr]:`, data.toString().trim());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`[FASHN] Python script completed successfully`);
          
          // Parse the result path from stdout or create expected path
          const expectedPath = `/static/results/${runId}/fashn/result_v${version}.png`;
          
          const result: ServiceResult = {
            id: `fashn_${runId}_v${version}_${Date.now()}`,
            service: 'fashn',
            runId,
            version,
            imagePath: expectedPath,
            parameters,
            timestamp: new Date(),
            status: 'success'
          };

          resolve(result);
        } else {
          console.error(`[FASHN] Python script failed with exit code ${code}`);
          console.error(`[FASHN] stderr: ${stderr}`);
          reject(new ServiceError(`FASHN Python script execution failed: ${stderr}`, 'fashn'));
        }
      });

      pythonProcess.on('error', (err) => {
        console.error(`[FASHN] Failed to start Python script:`, err);
        reject(new ServiceError(`Failed to start FASHN Python script: ${err.message}`, 'fashn'));
      });
    });
  }


  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      service: 'fashn',
      name: 'FASHN AI',
      version: 'v1.6',
      scriptPath: '/opt/python_scripts/fashn/test_job.py',
      workflow: 'Python script execution with child_process.spawn',
      processingTime: 'Depends on Python script execution time',
      features: [
        'Real Python script execution',
        'Two-step garment application',
        'Performance/Balanced/Quality modes',
        'Automatic garment categorization',
        'Seed-based reproducibility',
        'Multiple sample generation'
      ],
      limitations: [
        'Requires Python script at /opt/python_scripts/fashn/',
        'Depends on system Python3 installation',
        'Processing time varies by system resources'
      ],
      execution: {
        command: 'python3',
        scriptPath: '/opt/python_scripts/fashn/test_job.py',
        timeout: 'No timeout (depends on script)',
        errorHandling: 'Exit code and stderr monitoring'
      }
    };
  }
}

// Export singleton instance
export const fashnManager = FashnManager.getInstance();