// Individual run endpoint
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types/api';
import { UpdateRunRequest } from '@/lib/types/run';
import fs from 'fs';
import path from 'path';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const runs = loadRuns();
    const run = runs.find((r: any) => r.id === runId);
    
    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }
    
    const response: ApiResponse = {
      success: true,
      data: run,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching run:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch run',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const body: UpdateRunRequest = await request.json();
    const runs = loadRuns();
    const runIndex = runs.findIndex((r: any) => r.id === runId);
    
    if (runIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Run not found', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }
    
    // Update run with new data
    const updatedRun = {
      ...runs[runIndex],
      ...body,
      lastActivity: new Date().toISOString()
    };
    
    // If locking the run, set lockedAt timestamp
    if (body.status === 'locked' && runs[runIndex].status !== 'locked') {
      updatedRun.lockedAt = new Date().toISOString();
    }
    
    runs[runIndex] = updatedRun;
    saveRuns(runs);
    
    const response: ApiResponse = {
      success: true,
      data: updatedRun,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating run:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to update run',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const runs = loadRuns();
    const filteredRuns = runs.filter((r: any) => r.id !== runId);
    
    if (runs.length === filteredRuns.length) {
      return NextResponse.json(
        { success: false, error: 'Run not found', timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }
    
    saveRuns(filteredRuns);
    
    const response: ApiResponse = {
      success: true,
      data: { message: 'Run deleted successfully' },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting run:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to delete run',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}