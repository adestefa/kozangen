// Image selection modal component matching screenshot functionality
'use client';

import { useState, useEffect } from 'react';

interface ImageOption {
  filename: string;
  path: string;
  type: 'model' | 'clothing' | 'person';
  size: number;
  lastModified: string;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: ImageOption) => void;
  imageType: 'model' | 'clothing' | 'person';
  images: ImageOption[];
}

export default function ImageModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  imageType, 
  images 
}: ImageModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  // Get proper modal title
  const getModalTitle = () => {
    switch (imageType) {
      case 'model': return 'Select Model Image';
      case 'clothing': return 'Select Top Garment';
      case 'person': return 'Select Bottom Garment';
      default: return 'Select Image';
    }
  };

  // Filter images by type and search term
  const getImageTypeFilter = (modalType: string) => {
    switch (modalType) {
      case 'model': return 'model';
      case 'clothing': return 'top';  // Map clothing to top garments
      case 'person': return 'bottom'; // Map person to bottom garments
      default: return modalType;
    }
  };
  
  const filteredImages = images.filter(img => 
    img.type === getImageTypeFilter(imageType) && 
    img.filename.toLowerCase().includes(filter.toLowerCase())
  );

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = () => {
    const image = filteredImages.find(img => img.filename === selectedImage);
    if (image) {
      onSelect(image);
      onClose();
    }
  };

  const handleDoubleClick = (image: ImageOption) => {
    onSelect(image);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {getModalTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <input
            type="text"
            placeholder={`Search ${imageType} images...`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-auto p-6">
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredImages.map((image) => (
                <button
                  key={image.filename}
                  onClick={() => setSelectedImage(image.filename)}
                  onDoubleClick={() => handleDoubleClick(image)}
                  className={`
                    aspect-[3/4] border-2 rounded-lg overflow-hidden transition-all
                    ${selectedImage === image.filename 
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-3">
                    {/* Real image preview */}
                    <div className="w-full flex-1 rounded mb-2 overflow-hidden">
                      <img
                        src={`/api/static${image.path}`}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 font-medium truncate w-full">{image.filename}</p>
                      <p className="text-xs text-gray-400">{Math.round(image.size / 1024)}KB</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No {imageType} images found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {filteredImages.length > 0 && (
              <span>
                {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} available
                {selectedImage && ' • Double-click to select quickly'}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedImage}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Select Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}