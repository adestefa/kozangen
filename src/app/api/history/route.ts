// Service call history API - Get logged service calls
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types/api';
import { ServiceCall } from '@/lib/types/service';
import { historyLogger } from '@/lib/services/history-logger';

/**
 * GET /api/history
 * 
 * Get service call history with optional filtering
 * Query params: service?, status?, runId?, limit?, offset?
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const status = searchParams.get('status');
    const runId = searchParams.get('runId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Get all service calls
    const allCalls = historyLogger.getAllCalls();

    // Apply filters
    let filteredCalls = allCalls;

    if (service) {
      filteredCalls = filteredCalls.filter(call => call.service === service);
    }

    if (status) {
      filteredCalls = filteredCalls.filter(call => call.status === status);
    }

    if (runId) {
      filteredCalls = filteredCalls.filter(call => call.runId === runId);
    }

    // Sort by timestamp (newest first)
    filteredCalls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedCalls = filteredCalls.slice(offset, offset + limit);

    // Calculate statistics
    const stats = {
      totalCalls: allCalls.length,
      filteredCalls: filteredCalls.length,
      successCalls: filteredCalls.filter(c => c.status === 'success').length,
      errorCalls: filteredCalls.filter(c => c.status === 'error').length,
      pendingCalls: filteredCalls.filter(c => c.status === 'pending').length,
      averageDuration: filteredCalls
        .filter(c => c.duration !== undefined)
        .reduce((sum, c) => sum + (c.duration || 0), 0) / filteredCalls.filter(c => c.duration !== undefined).length || 0,
      serviceBreakdown: {
        huhu: filteredCalls.filter(c => c.service === 'huhu').length,
        fashn: filteredCalls.filter(c => c.service === 'fashn').length,
        fitroom: filteredCalls.filter(c => c.service === 'fitroom').length,
      }
    };

    const response: ApiResponse<{
      calls: ServiceCall[];
      stats: typeof stats;
      pagination: {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
      };
    }> = {
      success: true,
      data: {
        calls: paginatedCalls,
        stats,
        pagination: {
          limit,
          offset,
          total: filteredCalls.length,
          hasMore: offset + limit < filteredCalls.length
        }
      },
      message: 'Service call history retrieved successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] History retrieval error:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to retrieve service call history',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * DELETE /api/history
 * 
 * Clear service call history (admin operation)
 * Query params: confirm=true (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Confirmation required. Add ?confirm=true to clear history',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Clear all history
    const clearedCount = historyLogger.clearAllHistory();

    const response: ApiResponse<{ clearedCount: number }> = {
      success: true,
      data: { clearedCount },
      message: `Service call history cleared. ${clearedCount} records removed.`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] History clearing error:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to clear service call history',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}