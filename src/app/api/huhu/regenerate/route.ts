// HuHu regeneration API - Integrated with HuHu service manager
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, GenerateResponse } from '@/lib/types/api';
import { HuHuParameters } from '@/lib/types/service';
import { huhuManager } from '@/lib/services/huhu-manager';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';

/**
 * POST /api/huhu/regenerate
 * 
 * Regenerate outfit with HuHu AI using modified parameters
 * Body: { runId: string, parameters: HuHuParameters, version?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, parameters, version = 1 }: {
      runId: string;
      parameters: HuHuParameters;
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

    // Call HuHu service manager for regeneration
    console.log(`[API] Starting HuHu regeneration for run ${runId}, version ${version + 1}`);
    const result = await huhuManager.regenerate(runId, parameters, version);

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
        processingTime: `Regenerated in ${Math.round((Date.now() - new Date(result.timestamp).getTime()) / 1000)}s`,
        workflow: 'Two-step sequential (Top → Bottom)'
      },
      message: `HuHu regeneration v${result.version} completed successfully`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] HuHu regeneration error:', error);

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