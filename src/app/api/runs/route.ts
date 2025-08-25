// List runs endpoint
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, RunListResponse } from '@/lib/types/api';

export async function GET(_request: NextRequest) {
  try {
    // Mock response - will be replaced with real implementation
    const mockRuns: RunListResponse = {
      runs: [
        {
          id: 'run_001',
          name: 'Test Run 1',
          timestamp: new Date().toISOString(),
          status: 'completed',
          totalResults: 3,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'run_002', 
          name: 'Test Run 2',
          timestamp: new Date().toISOString(),
          status: 'active',
          totalResults: 1,
          lastActivity: new Date().toISOString()
        }
      ]
    };

    const response: ApiResponse<RunListResponse> = {
      success: true,
      data: mockRuns,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (_error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch runs',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// TODO: Implement POST for creating new runs