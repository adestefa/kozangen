// FASHN generation API - Integrated with FASHN service manager
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, GenerateResponse } from '@/lib/types/api';
import { FashnParameters } from '@/lib/types/service';
import { fashnManager } from '@/lib/services/fashn-manager';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';

/**
 * POST /api/fashn/generate
 * 
 * Generate full outfit using FASHN AI two-step process
 * Body: { runId: string, parameters: FashnParameters }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, parameters }: {
      runId: string;
      parameters: FashnParameters;
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

    // Call FASHN service manager
    console.log(`[API] Starting FASHN generation for run ${runId}`);
    const result = await fashnManager.generate(runId, parameters);

    const response: ApiResponse<GenerateResponse> = {
      success: true,
      data: {
        callId: result.id,
        runId: result.runId,
        service: 'fashn',
        status: 'completed',
        resultPath: result.imagePath,
        version: result.version,
        parameters: result.parameters,
        processingTime: `Completed in ${Math.round((Date.now() - new Date(result.timestamp).getTime()) / 1000)}s`,
        workflow: 'Two-step sequential with prediction polling'
      },
      message: 'FASHN generation completed successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] FASHN generation error:', error);

    // Handle different error types
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof ValidationError) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error instanceof ServiceError) {
      // Check for specific FASHN API errors
      if (error.message.includes('rate limit')) {
        statusCode = 429; // Too Many Requests
        errorMessage = 'FASHN API rate limit exceeded. Please retry after 60 seconds';
      } else {
        statusCode = 502; // Bad Gateway - external service error
        errorMessage = `FASHN service error: ${error.message}`;
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
 * GET /api/fashn/generate
 * 
 * Get FASHN service information and status
 */
export async function GET() {
  try {
    const serviceInfo = fashnManager.getServiceInfo();
    
    const response: ApiResponse = {
      success: true,
      data: serviceInfo,
      message: 'FASHN service information retrieved successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] FASHN service info error:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to retrieve FASHN service information',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}