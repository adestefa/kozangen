// List runs endpoint
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, RunListResponse } from '@/lib/types/api';
import { CreateRunRequest, UpdateRunRequest } from '@/lib/types/run';
import fs from 'fs';
import path from 'path';

// Simple file-based storage for runs
const RUNS_FILE = path.join(process.cwd(), 'data', 'runs.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(RUNS_FILE))) {
  fs.mkdirSync(path.dirname(RUNS_FILE), { recursive: true });
}

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

export async function GET(_request: NextRequest) {
  try {
    const runs = loadRuns();
    
    // Transform to run summaries
    const runSummaries = runs.map((run: any) => ({
      id: run.id,
      name: run.name,
      timestamp: run.timestamp,
      status: run.status,
      totalResults: run.results?.length || 0,
      lastActivity: run.lastActivity || run.timestamp,
      hasInputImages: !!(run.inputImages?.model && run.inputImages?.clothing && run.inputImages?.person),
      isLocked: run.status === 'locked' || run.status === 'completed'
    }));

    const response: ApiResponse<RunListResponse> = {
      success: true,
      data: { runs: runSummaries },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching runs:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch runs',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRunRequest = await request.json();
    const runs = loadRuns();
    
    const runId = `run_${Date.now()}`;
    const newRun = {
      id: runId,
      name: body.name || `Run ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      status: 'draft',
      inputImages: body.inputImages || {},
      aiSettings: {},
      results: [],
      lastActivity: new Date().toISOString()
    };
    
    runs.push(newRun);
    saveRuns(runs);
    
    const response: ApiResponse = {
      success: true,
      data: newRun,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating run:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to create run',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}