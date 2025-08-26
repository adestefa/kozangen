// HuHu service controller - Real Python script execution implementation
import { HuHuParameters, ServiceResult } from '@/lib/types/service';
import { historyLogger } from './history-logger';
import { ServiceError, ValidationError } from '@/lib/utils/error-handler';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';
import { spawn } from 'child_process';
import path from 'path';

/**
 * HuHu Manager - Real Python script execution for HuHu AI two-step try-on process
 * Step 1: Apply top garment to original model
 * Step 2: Apply bottom garment to Step 1 result
 * 
 * Executes: /opt/python_scripts/huhu/test_job.py
 * Processing time: Real processing time depends on Python script execution
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
   * Generate full outfit using HuHu AI two-step process (real Python execution)
   * Executes: /opt/python_scripts/huhu/test_job.py
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
      // Execute real Python script for HuHu generation
      const result = await this.executePythonScript(runId, parameters);
      
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
   * Regenerate outfit with different parameters (real Python execution)
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
      // Execute real Python script for HuHu regeneration
      const result = await this.executePythonScript(runId, parameters, version + 1);
      
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
   * Execute real Python script for HuHu AI two-step process
   * Calls the Python script at /opt/python_scripts/huhu/test_job.py
   */
  private async executePythonScript(
    runId: string,
    parameters: HuHuParameters,
    version = 1
  ): Promise<ServiceResult> {
    console.log(`[HuHu] Starting Python script execution for run ${runId}`);

    const scriptPath = '/opt/python_scripts/huhu/test_job.py';
    
    // Prepare arguments for Python script
    const args = [
      scriptPath,
      runId,
      parameters.model_image,
      parameters.top_garment,
      parameters.bottom_garment,
      '--model-type', parameters.model_type || 'SD_V2',
      '--repaint-other-garment', String(parameters.repaint_other_garment || true),
      '--repaint-hands', String(parameters.repaint_hands || false),
      '--repaint-feet', String(parameters.repaint_feet || false),
      '--version', String(version)
    ];

    console.log(`[HuHu] Executing: python3 ${args.join(' ')}`);

    return new Promise<ServiceResult>((resolve, reject) => {
      const pythonProcess = spawn('python3', args, {
        cwd: path.dirname(scriptPath),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`[HuHu stdout]:`, data.toString().trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`[HuHu stderr]:`, data.toString().trim());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`[HuHu] Python script completed successfully`);
          
          // Parse the result path from stdout or create expected path
          const expectedPath = `/static/results/${runId}/huhu/result_v${version}.jpg`;
          
          const result: ServiceResult = {
            id: `huhu_${runId}_v${version}_${Date.now()}`,
            service: 'huhu',
            runId,
            version,
            imagePath: expectedPath,
            parameters,
            timestamp: new Date(),
            status: 'success'
          };

          resolve(result);
        } else {
          console.error(`[HuHu] Python script failed with exit code ${code}`);
          console.error(`[HuHu] stderr: ${stderr}`);
          reject(new ServiceError(`HuHu Python script execution failed: ${stderr}`, 'huhu'));
        }
      });

      pythonProcess.on('error', (err) => {
        console.error(`[HuHu] Failed to start Python script:`, err);
        reject(new ServiceError(`Failed to start HuHu Python script: ${err.message}`, 'huhu'));
      });
    });
  }


  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      service: 'huhu',
      name: 'HuHu AI',
      version: 'v1',
      scriptPath: '/opt/python_scripts/huhu/test_job.py',
      workflow: 'Python script execution with child_process.spawn',
      processingTime: 'Depends on Python script execution time',
      features: [
        'Real Python script execution',
        'Two-step garment application',
        'SD_V1/V2/V3/HD model support',
        'Auto garment repainting',
        'Hand and foot repainting options'
      ],
      limitations: [
        'Requires Python script at /opt/python_scripts/huhu/',
        'Depends on system Python3 installation',
        'Processing time varies by system resources',
        'HD mode incompatible with repaint_other_garment'
      ],
      execution: {
        command: 'python3',
        scriptPath: '/opt/python_scripts/huhu/test_job.py',
        timeout: 'No timeout (depends on script)',
        errorHandling: 'Exit code and stderr monitoring'
      }
    };
  }
}

// Export singleton instance
export const huhuManager = HuHuManager.getInstance();