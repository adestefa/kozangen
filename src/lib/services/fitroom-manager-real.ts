// FitRoom service controller - REAL API implementation with comprehensive logging
import { FitRoomParameters, ServiceResult } from '@/lib/types/service';
import { historyLogger } from './history-logger';
import { ServiceError, ValidationError } from '@/lib/utils/error-handler';
import { showServiceStarted, showServiceSuccess, showServiceError } from '@/lib/utils/notifications';
import { RunManager } from '@/lib/utils/run-manager';
import { ServiceLogger } from '@/lib/utils/service-logger';
import https from 'https';
import http from 'http';
import fs from 'fs';
import FormData from 'form-data';

/**
 * FitRoom Manager - REAL FitRoom API v2 integration
 * Single call: Upload model + top + bottom simultaneously as multipart/form-data
 * 
 * API: POST https://platform.fitroom.app/api/tryon/v2/tasks
 * Processing time: 3-4 minutes (180-240 seconds)
 */
export class FitRoomManagerReal {
  private static instance: FitRoomManagerReal;
  private readonly apiKey = '7238bd996ec74549b5a377a6f203f8c5e91b03aedc36d4614c88395f01ed48c8';
  private readonly baseUrl = 'https://platform.fitroom.app';

  static getInstance(): FitRoomManagerReal {
    if (!FitRoomManagerReal.instance) {
      FitRoomManagerReal.instance = new FitRoomManagerReal();
    }
    return FitRoomManagerReal.instance;
  }

  /**
   * Generate full outfit using REAL FitRoom API with comprehensive logging
   */
  async generate(
    runId: string,
    parameters: FitRoomParameters
  ): Promise<ServiceResult> {
    const startTime = Date.now();
    let callId: string = '';
    
    try {
      // Step 1: Validate parameters
      this.validateParameters(parameters);

      // Step 2: Get run metadata  
      const metadata = RunManager.getMetadata(runId);

      // Step 3: Start logging - Chad and Melis will see this
      ServiceLogger.logStep(runId, 'fitroom', 'connecting');
      
      // Log the call for debugging
      callId = historyLogger.logCall({
        service: 'fitroom',
        action: 'generate',
        parameters,
        status: 'pending',
        runId
      });

      showServiceStarted('FitRoom', 'generation');

      // Step 4: Submit job to FitRoom API
      ServiceLogger.logStep(runId, 'fitroom', 'connecting', undefined, 'Preparing multipart upload with model, top, and bottom garments...');
      
      const jobId = await this.submitComboTryOn(
        metadata.urls.model_url,
        metadata.urls.top_url,
        metadata.urls.bottom_url,
        parameters
      );

      // Step 5: Job accepted
      ServiceLogger.logStep(runId, 'fitroom', 'received', jobId);

      // Step 6: Poll for completion with progress updates
      const resultImageUrl = await this.pollForResult(jobId, runId);

      // Step 7: Generation completed
      ServiceLogger.logStep(runId, 'fitroom', 'completed');

      // Step 8: Download result image
      ServiceLogger.logStep(runId, 'fitroom', 'downloading');
      
      const nextVersion = (metadata.services.fitroom?.versions.length || 0) + 1;
      const filename = await RunManager.downloadImage(
        resultImageUrl,
        runId,
        'fitroom',
        nextVersion
      );

      // Step 9: Update metadata and mark ready
      RunManager.addServiceResult(runId, 'fitroom', filename, parameters);
      ServiceLogger.logStep(runId, 'fitroom', 'ready', undefined, filename);

      const duration = Date.now() - startTime;

      // Log successful completion
      historyLogger.markSuccess(callId, `/api/results/${runId}/${filename}`, duration);

      showServiceSuccess('FitRoom', duration);

      return {
        success: true,
        resultUrl: `/api/results/${runId}/${filename}`,
        duration,
        version: nextVersion
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Determine specific error type for Chad and Melis
      let errorType: 'rate_limited' | 'out_of_tokens' | 'service_down' | 'bad_request' | 'timeout' | 'unknown_error' = 'unknown_error';
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          errorType = 'rate_limited';
        } else if (error.message.includes('insufficient') || error.message.includes('credit')) {
          errorType = 'out_of_tokens';
        } else if (error.message.includes('unavailable') || error.message.includes('503')) {
          errorType = 'service_down';
        } else if (error.message.includes('400') || error.message.includes('validation')) {
          errorType = 'bad_request';
        } else if (error.message.includes('timeout') || error.message.includes('5 minutes')) {
          errorType = 'timeout';
        }
      }

      // Log the error for Chad and Melis visibility
      ServiceLogger.logError(runId, 'fitroom', errorType, error instanceof Error ? error.message : 'Unknown error');
      
      // Log the failure for debugging
      historyLogger.markError(callId, error instanceof Error ? error.message : 'Unknown error', duration);

      showServiceError('FitRoom', error instanceof Error ? error.message : 'Unknown error');
      
      throw new ServiceError('FitRoom generation failed', 'fitroom');
    }
  }

  /**
   * Submit combo try-on job to FitRoom API
   */
  private async submitComboTryOn(
    modelUrl: string,
    topUrl: string,
    bottomUrl: string,
    parameters: FitRoomParameters
  ): Promise<string> {
    // Download images to temporary files
    const tempFiles = {
      model: await this.downloadToTemp(modelUrl, 'model.png'),
      top: await this.downloadToTemp(topUrl, 'top.jpeg'),
      bottom: await this.downloadToTemp(bottomUrl, 'bottom.jpeg')
    };

    try {
      // Create multipart form data
      const form = new FormData();
      form.append('model_image', fs.createReadStream(tempFiles.model));
      form.append('cloth_image', fs.createReadStream(tempFiles.top));
      form.append('lower_cloth_image', fs.createReadStream(tempFiles.bottom));
      form.append('cloth_type', 'combo');
      form.append('hd_mode', parameters.hdMode ? 'true' : 'false');

      // Submit to FitRoom API
      const response = await this.makeApiCall('/api/tryon/v2/tasks', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          ...form.getHeaders()
        },
        body: form
      });

      if (!response.job_id) {
        throw new Error('No job ID returned from FitRoom API');
      }

      return response.job_id;

    } finally {
      // Clean up temp files
      Object.values(tempFiles).forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
    }
  }

  /**
   * Poll FitRoom API for job completion with progress updates for Chad and Melis
   */
  private async pollForResult(jobId: string, runId: string, maxAttempts = 60): Promise<string> {
    let lastProgress = '';
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.checkJobStatus(jobId);
      
      // Update progress for Chad and Melis to see
      const elapsed = ServiceLogger.getElapsedTime(runId, 'fitroom');
      const progressMessage = `Processing HD combo outfit... ${elapsed} elapsed (attempt ${attempt}/${maxAttempts})`;
      
      if (progressMessage !== lastProgress) {
        ServiceLogger.logStep(runId, 'fitroom', 'processing', jobId, progressMessage);
        lastProgress = progressMessage;
      }
      
      if (status.status === 'completed' && status.result_url) {
        return status.result_url;
      } else if (status.status === 'failed') {
        throw new Error(`FitRoom job failed: ${status.error || 'Unknown error'}`);
      }
      
      // Wait 5 seconds before next check (FitRoom takes 3-4 minutes)
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('FitRoom job timed out after 5 minutes');
  }

  /**
   * Check job status on FitRoom API
   */
  private async checkJobStatus(jobId: string): Promise<any> {
    return this.makeApiCall(`/api/tryon/v2/tasks/${jobId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey
      }
    });
  }

  /**
   * Download URL to temporary file
   */
  private async downloadToTemp(url: string, filename: string): Promise<string> {
    const tempPath = `/tmp/fitroom_${Date.now()}_${filename}`;
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempPath);
      const protocol = url.startsWith('https:') ? https : http;
      
      protocol.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          fs.chmodSync(tempPath, 0o777);
          resolve(tempPath);
        });
      }).on('error', reject);
    });
  }

  /**
   * Make API call to FitRoom
   */
  private async makeApiCall(endpoint: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      
      const req = https.request(url, {
        method: options.method,
        headers: options.headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(`API error: ${res.statusCode} ${data}`));
            }
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        options.body.pipe(req);
      } else {
        req.end();
      }
    });
  }

  /**
   * Validate FitRoom parameters
   */
  private validateParameters(parameters: FitRoomParameters): void {
    if (!parameters) {
      throw new ValidationError('Parameters are required');
    }
    
    // FitRoom-specific validation
    if (parameters.hdMode === undefined) {
      parameters.hdMode = true; // Default to HD mode
    }
  }
}