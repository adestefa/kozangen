// FitRoom service controller - Real Python script execution implementation
import { FitRoomParameters, ServiceResult } from '@/lib/types/service';
import { historyLogger } from './history-logger';
import { ServiceError, ValidationError } from '@/lib/utils/error-handler';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';
import { spawn } from 'child_process';
import path from 'path';

/**
 * FitRoom Manager - Real Python script execution for FitRoom AI combo try-on process
 * Single call: Processes model + top + bottom in one Python execution
 * 
 * Executes: /opt/python_scripts/fitroom/test_job.py
 * Processing time: Real processing time depends on Python script execution
 * 
 * Unlike mock version, this executes actual Python scripts for generation
 */
export class FitRoomManager {
  private static instance: FitRoomManager;

  static getInstance(): FitRoomManager {
    if (!FitRoomManager.instance) {
      FitRoomManager.instance = new FitRoomManager();
    }
    return FitRoomManager.instance;
  }

  /**
   * Generate full outfit using FitRoom combo process (real Python execution)
   * Executes: /opt/python_scripts/fitroom/test_job.py
   */
  async generate(
    runId: string,
    parameters: FitRoomParameters
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: 'fitroom',
      action: 'generate',
      parameters,
      status: 'pending',
      runId
    });

    showServiceStarted('FitRoom', 'generation');

    try {
      // Execute real Python script for FitRoom generation
      const result = await this.executePythonScript(runId, parameters);
      
      const duration = Date.now() - startTime;
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FitRoom', 'generation');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FitRoom', 'generation', errorMessage);
      
      throw error;
    }
  }

  /**
   * Regenerate outfit with different parameters (real Python execution)
   */
  async regenerate(
    runId: string,
    parameters: FitRoomParameters,
    version = 1
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: 'fitroom',
      action: 'regenerate',
      parameters: { ...parameters, version },
      status: 'pending',
      runId
    });

    showServiceStarted('FitRoom', 'regeneration');

    try {
      // Execute real Python script for FitRoom regeneration
      const result = await this.executePythonScript(runId, parameters, version + 1);
      
      const duration = Date.now() - startTime;
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess('FitRoom', 'regeneration');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError('FitRoom', 'regeneration', errorMessage);
      
      throw error;
    }
  }

  /**
   * Validate FitRoom API parameters
   */
  private validateParameters(parameters: FitRoomParameters): void {
    if (!parameters.model_image) {
      throw new ValidationError('Model image is required');
    }

    if (!parameters.top_garment) {
      throw new ValidationError('Top garment image is required (cloth_image)');
    }

    if (!parameters.bottom_garment) {
      throw new ValidationError('Bottom garment image is required (lower_cloth_image)');
    }

    // Validate cloth_type if provided (should always be 'combo' for full outfits)
    if (parameters.cloth_type && parameters.cloth_type !== 'combo') {
      throw new ValidationError('cloth_type must be "combo" for full outfit generation');
    }

    // Validate image file formats (FitRoom requires actual files, not URLs)
    const filePattern = /\.(jpg|jpeg|png|webp)$/i;
    if (!filePattern.test(parameters.model_image)) {
      throw new ValidationError('Model image must be a valid image file (jpg, png, webp)');
    }
    if (!filePattern.test(parameters.top_garment)) {
      throw new ValidationError('Top garment must be a valid image file (jpg, png, webp)');
    }
    if (!filePattern.test(parameters.bottom_garment)) {
      throw new ValidationError('Bottom garment must be a valid image file (jpg, png, webp)');
    }
  }

  /**
   * Execute real Python script for FitRoom AI combo process
   * Calls the Python script at /opt/python_scripts/fitroom/test_job.py
   */
  private async executePythonScript(
    runId: string,
    parameters: FitRoomParameters,
    version = 1
  ): Promise<ServiceResult> {
    console.log(`[FitRoom] Starting Python script execution for run ${runId}`);

    const scriptPath = '/opt/python_scripts/fitroom/test_job.py';
    
    // Prepare arguments for Python script
    const args = [
      scriptPath,
      runId,
      parameters.model_image,
      parameters.top_garment,
      parameters.bottom_garment,
      '--cloth-type', parameters.cloth_type || 'combo',
      '--hd-mode', String(parameters.hd_mode || true),
      '--version', String(version)
    ];

    console.log(`[FitRoom] Executing: python3 ${args.join(' ')}`);

    return new Promise<ServiceResult>((resolve, reject) => {
      const pythonProcess = spawn('python3', args, {
        cwd: path.dirname(scriptPath),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`[FitRoom stdout]:`, data.toString().trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`[FitRoom stderr]:`, data.toString().trim());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`[FitRoom] Python script completed successfully`);
          
          // Parse the result path from stdout or create expected path
          const expectedPath = `/static/results/${runId}/fitroom/result_v${version}.jpg`;
          
          const result: ServiceResult = {
            id: `fitroom_${runId}_v${version}_${Date.now()}`,
            service: 'fitroom',
            runId,
            version,
            imagePath: expectedPath,
            parameters,
            timestamp: new Date(),
            status: 'success'
          };

          resolve(result);
        } else {
          console.error(`[FitRoom] Python script failed with exit code ${code}`);
          console.error(`[FitRoom] stderr: ${stderr}`);
          reject(new ServiceError(`FitRoom Python script execution failed: ${stderr}`, 'fitroom'));
        }
      });

      pythonProcess.on('error', (err) => {
        console.error(`[FitRoom] Failed to start Python script:`, err);
        reject(new ServiceError(`Failed to start FitRoom Python script: ${err.message}`, 'fitroom'));
      });
    });
  }


  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      service: 'fitroom',
      name: 'FitRoom AI',
      version: 'v2',
      scriptPath: '/opt/python_scripts/fitroom/test_job.py',
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
        scriptPath: '/opt/python_scripts/fitroom/test_job.py',
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
   * Get processing estimate based on parameters (real execution)
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