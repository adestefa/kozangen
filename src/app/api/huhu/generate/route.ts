// HuHu generation API - Integrated with HuHu service manager
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, GenerateResponse } from '@/lib/types/api';
import { HuHuParameters } from '@/lib/types/service';
import { huhuManager } from '@/lib/services/huhu-manager';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';

/**
 * POST /api/huhu/generate
 * 
 * Generate full outfit using HuHu AI two-step process
 * Body: { runId: string, parameters: HuHuParameters }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, parameters }: {
      runId: string;
      parameters: HuHuParameters;
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

    // Call HuHu service manager
    console.log(`[API] Starting HuHu generation for run ${runId}`);
    const result = await huhuManager.generate(runId, parameters);

    const response: ApiResponse<GenerateResponse> = {
      success: true,
      data: {
        callId: result.id,
        runId: result.runId,
        service: 'huhu',
        status: 'completed',
        resultPath: result.imagePath,
        version: result.version,
        parameters: result.parameters,
        processingTime: `Completed in ${Math.round((Date.now() - new Date(result.timestamp).getTime()) / 1000)}s`,
        workflow: 'Two-step sequential (Top → Bottom)'
      },
      message: 'HuHu generation completed successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] HuHu generation error:', error);

    // Handle different error types
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof ValidationError) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error instanceof ServiceError) {
      statusCode = 502; // Bad Gateway - external service error
      errorMessage = `HuHu service error: ${error.message}`;
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
 * GET /api/huhu/generate
 * 
 * Get HuHu service information and status
 */
export async function GET() {
  try {
    const serviceInfo = huhuManager.getServiceInfo();
    
    const response: ApiResponse = {
      success: true,
      data: serviceInfo,
      message: 'HuHu service information retrieved successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] HuHu service info error:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to retrieve HuHu service information',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}