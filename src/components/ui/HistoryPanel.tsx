// History and Analytics panel component
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ServiceCall } from '@/lib/types/service';

interface HistoryStats {
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  pendingCalls: number;
  successRate: number;
  averageDuration: number;
  serviceBreakdown: {
    huhu: number;
    fashn: number;
    fitroom: number;
  };
}

interface HistoryData {
  calls: ServiceCall[];
  stats: HistoryStats;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    service: '',
    status: '',
    limit: 20
  });

  // Fetch history data
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter.service) params.append('service', filter.service);
      if (filter.status) params.append('status', filter.status);
      params.append('limit', filter.limit.toString());

      const response = await fetch(`/api/history?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      setHistoryData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch data when panel opens or filter changes
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Service Call History & Analytics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-80px)]">
          {/* Stats Overview */}
          {historyData && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{historyData.stats.totalCalls}</div>
                  <div className="text-sm text-gray-600">Total Calls</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{historyData.stats.successRate}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatDuration(historyData.stats.averageDuration)}</div>
                  <div className="text-sm text-gray-600">Avg Duration</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{historyData.stats.errorCalls}</div>
                  <div className="text-sm text-gray-600">Failed Calls</div>
                </div>
              </div>

              {/* Service Breakdown */}
              <div className="mt-4 flex justify-center space-x-8">
                <div className="text-center">
                  <div className="text-lg font-semibold">{historyData.stats.serviceBreakdown.huhu}</div>
                  <div className="text-sm text-gray-600">HuHu</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{historyData.stats.serviceBreakdown.fashn}</div>
                  <div className="text-sm text-gray-600">FASHN</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{historyData.stats.serviceBreakdown.fitroom}</div>
                  <div className="text-sm text-gray-600">FitRoom</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-4">
            <select
              value={filter.service}
              onChange={(e) => setFilter(prev => ({ ...prev, service: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">All Services</option>
              <option value="huhu">HuHu AI</option>
              <option value="fashn">FASHN AI</option>
              <option value="fitroom">FitRoom</option>
            </select>

            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={filter.limit}
              onChange={(e) => setFilter(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="10">10 items</option>
              <option value="20">20 items</option>
              <option value="50">50 items</option>
              <option value="100">100 items</option>
            </select>

            <button
              onClick={fetchHistory}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* History Table */}
          <div className="flex-1 overflow-auto">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="m-6 p-4 bg-red-50 border border-red-200 rounded">
                <div className="text-red-800 font-medium">Error loading history</div>
                <div className="text-red-600 text-sm mt-1">{error}</div>
              </div>
            )}

            {historyData && !loading && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Service</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Action</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Duration</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Run ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Timestamp</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historyData.calls.map((call) => (
                      <tr key={call.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 uppercase">
                          {call.service}
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">
                          {call.action}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDuration(call.duration)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                          {call.runId}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatTimestamp(call.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate">
                          {call.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {historyData.calls.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No service calls found matching your filters.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {historyData && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
              Showing {historyData.calls.length} of {historyData.pagination.total} calls
              {historyData.pagination.hasMore && (
                <span className="ml-2 text-blue-600">
                  (More available - adjust limit to see more)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}