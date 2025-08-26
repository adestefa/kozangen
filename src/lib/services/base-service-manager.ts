// Base service manager with common functionality for all AI services
import { ServiceParameters, ServiceResult } from '@/lib/types/service';
import { historyLogger } from './history-logger';
import { ServiceError, ValidationError } from '@/lib/utils/error-handler';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';
import { spawn } from 'child_process';

/**
 * BaseServiceManager - Common functionality for all AI service managers
 * Handles Python script execution, logging, validation, and error handling
 */
export abstract class BaseServiceManager {
  protected abstract serviceName: string;
  protected abstract scriptPath: string;
  
  /**
   * Execute Python script with parameters
   */
  protected async executePythonScript(
    runId: string,
    parameters: ServiceParameters,
    action: 'generate' | 'regenerate'
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    
    // Validate parameters
    this.validateParameters(parameters);

    // Log the call
    const callId = historyLogger.logCall({
      service: this.serviceName,
      action,
      parameters,
      status: 'pending',
      runId
    });

    showServiceStarted(this.serviceName.toUpperCase(), action);

    try {
      // Execute Python script
      const result = await this.runPythonScript(runId, parameters);
      const duration = Date.now() - startTime;

      // Mark as successful
      historyLogger.markSuccess(callId, result.imagePath, duration);
      showServiceSuccess(this.serviceName.toUpperCase(), action);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark as failed
      historyLogger.markError(callId, errorMessage, duration);
      showServiceError(this.serviceName.toUpperCase(), action, errorMessage);

      throw error;
    }
  }

  /**
   * Run Python script with child_process.spawn
   */
  private async runPythonScript(
    runId: string,
    parameters: ServiceParameters
  ): Promise<ServiceResult> {
    return new Promise((resolve, reject) => {
      const scriptArgs = this.buildScriptArgs(runId, parameters);
      
      console.log(`[${this.serviceName.toUpperCase()}] Executing Python script:`, this.scriptPath);
      console.log(`[${this.serviceName.toUpperCase()}] Args:`, scriptArgs);

      const pythonProcess = spawn('python3', [this.scriptPath, ...scriptArgs], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`[${this.serviceName.toUpperCase()}] stdout:`, output.trim());
      });

      pythonProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        console.error(`[${this.serviceName.toUpperCase()}] stderr:`, error.trim());
      });

      pythonProcess.on('close', (code) => {
        console.log(`[${this.serviceName.toUpperCase()}] Process exited with code ${code}`);

        if (code === 0) {
          // Success - parse result
          try {
            const result = this.parseResult(stdout, runId);
            resolve(result);
          } catch (parseError) {
            reject(new ServiceError(
              `Failed to parse ${this.serviceName} result: ${parseError.message}`,
              'parse_error'
            ));
          }
        } else {
          // Error
          reject(new ServiceError(
            `${this.serviceName} Python script failed with exit code ${code}: ${stderr}`,
            'python_execution_failed'
          ));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new ServiceError(
          `Failed to start ${this.serviceName} Python process: ${error.message}`,
          'python_process_failed'
        ));
      });
    });
  }

  /**
   * Abstract methods that must be implemented by derived classes
   */
  protected abstract validateParameters(parameters: ServiceParameters): void;
  protected abstract buildScriptArgs(runId: string, parameters: ServiceParameters): string[];
  protected abstract parseResult(stdout: string, runId: string): ServiceResult;

  /**
   * Common validation helpers
   */
  protected validateRequiredParam(value: unknown, paramName: string): void {
    if (!value) {
      throw new ValidationError(`Missing required parameter: ${paramName}`, paramName);
    }
  }

  protected validateImagePath(imagePath: string, paramName: string): void {
    if (!imagePath || typeof imagePath !== 'string') {
      throw new ValidationError(`Invalid image path for ${paramName}`, paramName);
    }
  }

  /**
   * Common result parsing helpers
   */
  protected parseImageResult(stdout: string, runId: string): ServiceResult {
    try {
      // Try to parse JSON output first
      const lines = stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      
      if (lastLine.startsWith('{')) {
        const result = JSON.parse(lastLine);
        return {
          success: true,
          imagePath: result.output_path || result.image_path,
          service: this.serviceName,
          runId,
          timestamp: new Date()
        };
      }
      
      // Fallback: look for image path patterns
      const imagePathMatch = stdout.match(/(?:output_path|image_path|result):\s*([^\s\n]+\.(?:png|jpg|jpeg))/i);
      if (imagePathMatch) {
        return {
          success: true,
          imagePath: imagePathMatch[1],
          service: this.serviceName,
          runId,
          timestamp: new Date()
        };
      }
      
      throw new Error('No valid image path found in output');
    } catch (error) {
      throw new ServiceError(
        `Failed to parse ${this.serviceName} output: ${error.message}`,
        'parse_error'
      );
    }
  }
}