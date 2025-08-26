// Individual service display component matching screenshot design
'use client';

import { useState } from 'react';
import { ServiceType, ServiceParameters } from '@/lib/types/service';
import { RunResult } from '@/lib/types/run';

interface ServiceCardProps {
  service: ServiceType;
  results: RunResult[];
  currentVersion: number;
  onGenerate: (parameters: ServiceParameters) => void;
  onRegenerate: (parameters: ServiceParameters) => void;
  onVersionChange: (version: number) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  error?: string | null;
  progress?: string;
  onClearError?: () => void;
}

export default function ServiceCard({
  service,
  results,
  currentVersion,
  onGenerate,
  onRegenerate,
  onVersionChange,
  isGenerating,
  canGenerate,
  error,
  progress,
  onClearError
}: ServiceCardProps) {
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  
  // Calculate results state first
  const hasResults = results.length > 0;
  
  // Service display names and colors matching screenshot
  const getServiceInfo = () => {
    const name = service === 'huhu' ? 'HuHu AI' : 
                 service === 'fitroom' ? 'Fitroom' :
                 service === 'fashn' ? 'FASHN AI' : service;
    
    // Determine status based on current state
    let status = 'Ready';
    let statusColor = 'text-gray-600';
    let bgColor = 'bg-gray-50';

    if (error) {
      status = 'Generation Failed';
      statusColor = 'text-red-600';
      bgColor = 'bg-red-50';
    } else if (isGenerating) {
      status = progress || 'Generating...';
      statusColor = 'text-blue-600';
      bgColor = 'bg-blue-50';
    } else if (hasResults) {
      status = 'Generated Successfully';
      statusColor = 'text-green-600';
      bgColor = 'bg-green-50';
    }

    return { name, status, statusColor, bgColor };
  };

  const serviceInfo = getServiceInfo();
  const _currentResult = results.find(r => r.version === currentVersion);
  const maxVersion = Math.max(...results.map(r => r.version), 0);

  // Mock parameters matching screenshot
  const getServiceParameters = () => {
    switch (service) {
      case 'huhu':
        return {
          'AI Model': 'SD v2 (Recommended)',
          'Repaint other garment': true,
          'Repaint hands': false,
          'Generate matching shoes': false
        };
      case 'fitroom':
        return {
          'HD Mode (higher quality)': true,
          'Mode': 'v2 of 2'
        };
      case 'fashn':
        return {
          'Mode': 'Quality (newest)',
          'Seed (for variations)': '0'
        };
      default:
        return {};
    }
  };

  const serviceParams = getServiceParameters();

  const handleGenerate = () => {
    if (hasResults) {
      onRegenerate(serviceParams as ServiceParameters);
    } else {
      onGenerate(serviceParams as ServiceParameters);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 text-center">
        <h3 className="text-lg font-semibold text-gray-900">{serviceInfo.name}</h3>
        <p className={`text-sm mt-1 ${serviceInfo.statusColor}`}>
          {serviceInfo.status}
        </p>
      </div>

      {/* Image Display Area */}
      <div className="px-6 pb-4">
        <div className={`w-full h-80 border-2 rounded-lg ${serviceInfo.bgColor} flex items-center justify-center overflow-hidden`}>
          {isGenerating ? (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Generating...</p>
            </div>
          ) : hasResults ? (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              {/* Mock generated image placeholder */}
              <div className="text-center">
                <div className="w-32 h-40 bg-gray-300 rounded mx-auto mb-2 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-sm">No result generated yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Regenerate Button */}
      <div className="px-6 pb-4">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className={`
            w-full py-2 px-4 rounded-md font-medium text-sm transition-colors
            ${canGenerate && !isGenerating
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? 'Generating...' : hasResults ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {/* Version Navigation */}
      {hasResults && maxVersion > 1 && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
            <button
              onClick={() => onVersionChange(Math.max(1, currentVersion - 1))}
              disabled={currentVersion <= 1}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: maxVersion }, (_, i) => i + 1).map((version) => (
                <button
                  key={version}
                  onClick={() => onVersionChange(version)}
                  className={`w-2 h-2 rounded-full ${
                    version === currentVersion ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => onVersionChange(Math.min(maxVersion, currentVersion + 1))}
              disabled={currentVersion >= maxVersion}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
            
            <span>v{currentVersion} of {maxVersion}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-6 pb-4 border-t border-gray-200 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">Generation Failed</h4>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="ml-2 text-red-600 hover:text-red-800 transition-colors"
                  title="Clear error"
                >
                  <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Parameters Section */}
      <div className="px-6 pb-6 border-t border-gray-200 pt-4">
        {Object.entries(serviceParams).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-1 text-sm">
            <span className="text-gray-700">{key}</span>
            <div className="flex items-center">
              {typeof value === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setParameters(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="mr-2"
                />
              ) : (
                <select className="text-xs border border-gray-300 rounded px-2 py-1">
                  <option>{String(value)}</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}