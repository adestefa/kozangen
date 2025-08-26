// FitRoom generation API - Integrated with REAL FitRoom service manager
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, GenerateResponse } from '@/lib/types/api';
import { FitRoomParameters } from '@/lib/types/service';
import { FitRoomManagerReal } from '@/lib/services/fitroom-manager-real';
import { RunManager } from '@/lib/utils/run-manager';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/fitroom/generate
 * 
 * Generate full outfit using FitRoom AI single combo process
 * Body: { runId: string, parameters: FitRoomParameters }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, parameters }: {
      runId: string;
      parameters: FitRoomParameters;
    } = body;

    // Validate required fields
    if (!runId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'runId is required',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!parameters) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'parameters are required',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Step 1: Create enhanced run structure if needed
    console.log(`[API] Setting up enhanced run structure for ${runId}`);
    
    // Get current run data from runs.json
    const runsFile = path.join(process.cwd(), 'data', 'runs.json');
    const runs = JSON.parse(fs.readFileSync(runsFile, 'utf8'));
    const currentRun = runs.find((r: any) => r.id === runId);
    
    if (!currentRun) {
      throw new Error(`Run ${runId} not found`);
    }

    // Create enhanced run folder structure using RunManager
    let enhancedRunId: string;
    try {
      enhancedRunId = RunManager.createRun(currentRun);
      console.log(`[API] Created enhanced run: ${enhancedRunId}`);
    } catch (error) {
      console.log(`[API] Enhanced run may already exist, continuing...`);
      // If run already exists, extract runId from current run or generate one
      enhancedRunId = runId.includes('_') ? runId : RunManager.generateRunId();
    }

    // Step 2: Call REAL FitRoom service manager
    console.log(`[API] Starting REAL FitRoom generation for enhanced run ${enhancedRunId}`);
    const fitroomManager = FitRoomManagerReal.getInstance();
    const result = await fitroomManager.generate(enhancedRunId, parameters);

    const response: ApiResponse<GenerateResponse> = {
      success: true,
      data: {
        callId: `fitroom_${runId}_${Date.now()}`,
        runId,
        service: 'fitroom',
        status: 'completed',
        resultPath: result.imagePath,
        version: result.version,
        parameters,
        processingTime: 'Processing time depends on Python script execution',
        workflow: 'REAL FitRoom API - Single combo call with multipart upload'
      },
      message: 'FitRoom generation completed successfully with REAL API',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] FitRoom generation error:', error);

    // Handle different error types
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof ValidationError) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error instanceof ServiceError) {
      // Check for specific FitRoom API errors
      if (error.message.includes('Out of memory')) {
        statusCode = 507; // Insufficient Storage
        errorMessage = 'FitRoom processing failed: Insufficient memory. Try reducing image resolution';
      } else if (error.message.includes('X-API-KEY')) {
        statusCode = 401; // Unauthorized
        errorMessage = 'Invalid FitRoom API key';
      } else {
        statusCode = 502; // Bad Gateway - external service error
        errorMessage = `FitRoom service error: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const errorResponse: ApiResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * GET /api/fitroom/generate
 * 
 * Get FitRoom service information and status
 */
export async function GET() {
  try {
    const serviceInfo = {
      service: 'fitroom',
      version: '2.0',
      status: 'active',
      endpoint: 'https://platform.fitroom.app/api/tryon/v2/tasks',
      processingTime: '180-240 seconds',
      method: 'Single combo call - multipart upload',
      realApi: true
    };
    
    const response: ApiResponse = {
      success: true,
      data: serviceInfo,
      message: 'FitRoom REAL API service information retrieved successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] FitRoom service info error:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to retrieve FitRoom service information',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}