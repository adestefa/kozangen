// FitRoom regeneration API - Integrated with FitRoom service manager
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, GenerateResponse } from '@/lib/types/api';
import { FitRoomParameters } from '@/lib/types/service';
import { fitroomManager } from '@/lib/services/fitroom-manager';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';

/**
 * POST /api/fitroom/regenerate
 * 
 * Regenerate outfit with FitRoom AI using modified parameters
 * Body: { runId: string, parameters: FitRoomParameters, version?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, parameters, version = 1 }: {
      runId: string;
      parameters: FitRoomParameters;
      version?: number;
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

    // Call FitRoom service manager for regeneration
    console.log(`[API] Starting FitRoom regeneration for run ${runId}, version ${version + 1}`);
    const result = await fitroomManager.regenerate(runId, parameters, version);

    const response: ApiResponse<GenerateResponse> = {
      success: true,
      data: {
        callId: result.id,
        runId: result.runId,
        service: 'fitroom',
        status: 'completed',
        resultPath: result.imagePath,
        version: result.version,
        parameters: result.parameters,
        processingTime: `Regenerated in ${Math.round((Date.now() - new Date(result.timestamp).getTime()) / 1000)}s`,
        workflow: 'Single combo execution (Top + Bottom)'
      },
      message: `FitRoom regeneration v${result.version} completed successfully`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] FitRoom regeneration error:', error);

    // Handle different error types
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof ValidationError) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error instanceof ServiceError) {
      statusCode = 502; // Bad Gateway - external service error
      errorMessage = `FitRoom service error: ${error.message}`;
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
 * GET /api/fitroom/regenerate
 * 
 * Get FitRoom service information and status
 */
export async function GET() {
  try {
    const serviceInfo = fitroomManager.getServiceInfo();
    
    const response: ApiResponse = {
      success: true,
      data: serviceInfo,
      message: 'FitRoom service information retrieved successfully',
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