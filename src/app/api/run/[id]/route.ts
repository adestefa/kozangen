// Get run data endpoint
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types/api';
import { Run } from '@/lib/types/run';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await params;

    // Mock response - will be replaced with real implementation
    const mockRun: Run = {
      id: runId,
      name: `Test Run ${runId}`,
      timestamp: new Date(),
      status: 'active',
      inputImages: {
        model: '/static/input/model_001.jpg',
        clothing: '/static/input/clothing_001.jpg',
        person: '/static/input/person_001.jpg'
      },
      results: [
        {
          id: 'huhu_001',
          service: 'huhu',
          version: 1,
          imagePath: '/static/results/run_001/huhu/result_v1.jpg',
          parameters: { strength: 0.8, steps: 20 },
          timestamp: new Date(),
          status: 'success'
        }
      ]
    };

    const response: ApiResponse<Run> = {
      success: true,
      data: mockRun,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (_error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch run data',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// TODO: Implement PUT for updating runs
// TODO: Implement DELETE for removing runs