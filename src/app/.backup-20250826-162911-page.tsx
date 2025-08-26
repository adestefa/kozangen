'use client';

import Header from '@/components/layout/Header';
import RunSelector from '@/components/ui/RunSelector';
import InputPanel from '@/components/ui/InputPanel';
import ServiceCard from '@/components/ui/ServiceCard';
import ImageModal from '@/components/ui/ImageModal';
import HistoryPanel from '@/components/ui/HistoryPanel';
import { useRunManager } from '@/hooks/useRunManager';
import { useGeneration } from '@/hooks/useGeneration';
import { useDashboardState } from '@/hooks/useDashboardState';

export default function Dashboard() {
  // Custom hooks for separation of concerns
  const runManager = useRunManager();
  const dashboardState = useDashboardState();
  
  const generation = useGeneration({
    selectedRun: runManager.selectedRun,
    inputImages: runManager.inputImages,
    runStatus: runManager.runStatus,
    lockRun: runManager.lockRun,
  });

  // Handle image selection from modal
  const handleImageModalSelect = async (image: { type: string; path: string; filename: string }) => {
    await dashboardState.handleImageSelection(
      image, 
      runManager.inputImages, 
      runManager.updateInputImages
    );
  };

  // Handle image click (select or view when locked)
  const handleImageSelect = (type: 'model' | 'clothing' | 'person') => {
    dashboardState.handleImageClick(type, runManager.inputImages, runManager.inputsLocked);
  };

  // Loading states
  if (runManager.isLoading || dashboardState.imagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (runManager.error || dashboardState.imagesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{runManager.error || dashboardState.imagesError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Run Selection */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Run:</span>
            <RunSelector
              runs={runManager.runs}
              selectedRun={runManager.selectedRun}
              onRunSelect={runManager.handleRunSelect}
              onNewRun={runManager.handleNewRun}
            />
          </div>
          
          {/* Run Info */}
          <div className="flex items-center gap-4">
            {runManager.selectedRun && runManager.run && (
              <div className="text-sm text-gray-600">
                {`Run: ${runManager.selectedRun} | Results: ${runManager.run.results?.length || 0}`}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* History Button */}
              <button
                onClick={dashboardState.openHistoryPanel}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="View Service History"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              
              {/* Generate All Button */}
              {generation.canGenerate && (
                <button
                  onClick={generation.handleGenerateAll}
                  disabled={generation.isAnyGenerating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generation.isAnyGenerating ? 'Generating...' : 'Generate All Services'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Images */}
        <div className="mb-8">
          <InputPanel
            images={runManager.inputImages}
            onImageSelect={handleImageSelect}
            disabled={runManager.isLoading}
            locked={runManager.inputsLocked}
          />
        </div>

        {/* AI Generated Results */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Generated Results</h2>
          <p className="text-sm text-gray-600">
            Click any image to view full-size. {generation.isAnyGenerating && 'Services are currently processing...'}
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ServiceCard
            service="huhu"
            results={runManager.run?.results?.filter(r => r.service === 'huhu') || []}
            currentVersion={1}
            onGenerate={(params) => generation.handleGenerate('huhu', params)}
            onRegenerate={(params) => generation.handleRegenerate('huhu', params)}
            onVersionChange={() => {}}
            isGenerating={generation.services.huhu.isGenerating}
            canGenerate={generation.canGenerate}
            error={generation.services.huhu.error}
            progress={generation.services.huhu.progress}
            onClearError={() => generation.clearServiceError('huhu')}
          />
          
          <ServiceCard
            service="fitroom"
            results={runManager.run?.results?.filter(r => r.service === 'fitroom') || []}
            currentVersion={1}
            onGenerate={(params) => generation.handleGenerate('fitroom', params)}
            onRegenerate={(params) => generation.handleRegenerate('fitroom', params)}
            onVersionChange={() => {}}
            isGenerating={generation.services.fitroom.isGenerating}
            canGenerate={generation.canGenerate}
            error={generation.services.fitroom.error}
            progress={generation.services.fitroom.progress}
            onClearError={() => generation.clearServiceError('fitroom')}
          />
          
          <ServiceCard
            service="fashn"
            results={runManager.run?.results?.filter(r => r.service === 'fashn') || []}
            currentVersion={1}
            onGenerate={(params) => generation.handleGenerate('fashn', params)}
            onRegenerate={(params) => generation.handleRegenerate('fashn', params)}
            onVersionChange={() => {}}
            isGenerating={generation.services.fashn.isGenerating}
            canGenerate={generation.canGenerate}
            error={generation.services.fashn.error}
            progress={generation.services.fashn.progress}
            onClearError={() => generation.clearServiceError('fashn')}
          />
        </div>
      </div>

      {/* Image Selection Modal */}
      <ImageModal
        isOpen={dashboardState.imageModal.isOpen}
        onClose={dashboardState.closeImageModal}
        onSelect={handleImageModalSelect}
        imageType={dashboardState.imageModal.type || 'model'}
        images={dashboardState.images}
      />

      {/* History Panel */}
      <HistoryPanel
        isOpen={dashboardState.historyPanel}
        onClose={dashboardState.closeHistoryPanel}
      />
    </div>
  );
}