// Run dropdown component matching screenshot design
'use client';

import { useState } from 'react';
import { RunSummary } from '@/lib/types/run';

interface RunSelectorProps {
  runs: RunSummary[];
  selectedRun: string | null;
  onRunSelect: (runId: string) => void;
  onNewRun: () => void;
}

export default function RunSelector({ 
  runs, 
  selectedRun, 
  onRunSelect, 
  onNewRun 
}: RunSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentRun = runs.find(run => run.id === selectedRun);

  return (
    <div className="relative flex items-center gap-3">
      {/* Dropdown Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-72 px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="truncate text-sm">
            {currentRun ? currentRun.name : 'Select a run...'}
          </span>
          <svg
            className={`ml-2 h-4 w-4 transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 w-72 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="max-h-60 overflow-auto">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => {
                    onRunSelect(run.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                    selectedRun === run.id ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="font-medium truncate text-sm">{run.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(run.timestamp).toLocaleDateString()} • {run.totalResults} results
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button (Green) */}
      <button
        onClick={() => window.location.reload()}
        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>

      {/* New Run Button (Blue) */}
      <button
        onClick={onNewRun}
        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Run
      </button>
    </div>
  );
}