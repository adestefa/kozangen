// HuHu generation API - Integrated with HuHu service manager
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, GenerateResponse } from '@/lib/types/api';
import { HuHuParameters, ServiceResult } from '@/lib/types/service';
import { huhuManager } from '@/lib/services/huhu-manager';
import { ValidationError, ServiceError } from '@/lib/utils/error-handler';
import fs from 'fs';
import path from 'path';

// Runs data management
const RUNS_FILE = path.join(process.cwd(), 'data', 'runs.json');

// Load runs from file
function loadRuns() {
  try {
    if (fs.existsSync(RUNS_FILE)) {
      const data = fs.readFileSync(RUNS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading runs:', error);
  }
  return [];
}

// Save runs to file
function saveRuns(runs: any[]) {
  try {
    fs.writeFileSync(RUNS_FILE, JSON.stringify(runs, null, 2));
  } catch (error) {
    console.error('Error saving runs:', error);
    throw error;
  }
}

// Save result to run
async function saveResultToRun(runId: string, result: ServiceResult) {
  console.log(`[saveResultToRun] Attempting to save result for run: ${runId}`);
  console.log(`[saveResultToRun] Result:`, JSON.stringify(result, null, 2));
  
  const runs = loadRuns();
  console.log(`[saveResultToRun] Loaded ${runs.length} runs`);
  
  const runIndex = runs.findIndex((r: any) => r.id === runId);
  console.log(`[saveResultToRun] Found run at index: ${runIndex}`);
  
  if (runIndex === -1) {
    console.error(`[saveResultToRun] Run ${runId} not found in runs array`);
    throw new Error(`Run ${runId} not found`);
  }
  
  // Initialize results array if it doesn't exist
  if (!runs[runIndex].results) {
    runs[runIndex].results = [];
    console.log(`[saveResultToRun] Initialized results array for run ${runId}`);
  }
  
  // Remove existing result for this service to avoid duplicates
  const originalLength = runs[runIndex].results.length;
  runs[runIndex].results = runs[runIndex].results.filter((r: any) => r.service !== 'huhu');
  const newLength = runs[runIndex].results.length;
  console.log(`[saveResultToRun] Filtered existing HuHu results: ${originalLength} -> ${newLength}`);
  
  // Add new result
  const newResult = {
    id: result.id,
    service: result.service,
    imagePath: result.imagePath,
    version: result.version || 1,
    timestamp: new Date().toISOString(),
    status: result.status,
    parameters: result.parameters
  };
  
  runs[runIndex].results.push(newResult);
  console.log(`[saveResultToRun] Added new result. Total results: ${runs[runIndex].results.length}`);
  
  // Update run's last activity
  runs[runIndex].lastActivity = new Date().toISOString();
  console.log(`[saveResultToRun] Updated lastActivity for run ${runId}`);
  
  saveRuns(runs);
  console.log(`[saveResultToRun] Successfully saved runs to file`);
}

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

    // Save result to run
    console.log(`[API] Saving HuHu result to run ${runId}`);
    try {
      await saveResultToRun(runId, result);
      console.log(`[API] Successfully saved result to run ${runId}`);
    } catch (saveError) {
      console.error(`[API] Failed to save result to run ${runId}:`, saveError);
      // Continue anyway - return the result even if saving fails
    }

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
        processingTime: `Completed in ${Math.round((Date.now() - result.timestamp.getTime()) / 1000)}s`,
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