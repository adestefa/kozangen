import { useState } from 'react';
import { useInputImages } from '@/hooks/useRuns';
import { InputImages } from '@/hooks/useRunManager';

export interface ImageModalState {
  isOpen: boolean;
  type: 'model' | 'clothing' | 'person' | null;
}

export interface UseDashboardStateReturn {
  // UI State
  imageModal: ImageModalState;
  historyPanel: boolean;
  
  // Image data
  images: Array<{ type: string; path: string; filename: string }>;
  imagesLoading: boolean;
  imagesError: string | null;
  
  // Actions
  openImageModal: (type: 'model' | 'clothing' | 'person') => void;
  closeImageModal: () => void;
  openHistoryPanel: () => void;
  closeHistoryPanel: () => void;
  handleImageSelection: (
    image: { type: string; path: string; filename: string },
    currentImages: InputImages,
    updateInputImages: (images: InputImages) => Promise<void>
  ) => Promise<void>;
  handleImageClick: (
    type: 'model' | 'clothing' | 'person',
    currentImages: InputImages,
    inputsLocked: boolean
  ) => void;
}

export function useDashboardState(): UseDashboardStateReturn {
  // UI State
  const [imageModal, setImageModal] = useState<ImageModalState>({
    isOpen: false, 
    type: null
  });
  const [historyPanel, setHistoryPanel] = useState(false);

  // Image data
  const { images, isLoading: imagesLoading, error: imagesError } = useInputImages();

  // Modal management
  const openImageModal = (type: 'model' | 'clothing' | 'person') => {
    setImageModal({ isOpen: true, type });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, type: null });
  };

  // Panel management
  const openHistoryPanel = () => {
    setHistoryPanel(true);
  };

  const closeHistoryPanel = () => {
    setHistoryPanel(false);
  };

  // Handle image selection from modal
  const handleImageSelection = async (
    image: { type: string; path: string; filename: string },
    currentImages: InputImages,
    updateInputImages: (images: InputImages) => Promise<void>
  ) => {
    if (imageModal.type) {
      const newInputImages = {
        ...currentImages,
        [imageModal.type]: image
      };
      await updateInputImages(newInputImages);
    }
    closeImageModal();
  };

  // Handle image click (select or view)
  const handleImageClick = (
    type: 'model' | 'clothing' | 'person',
    currentImages: InputImages,
    inputsLocked: boolean
  ) => {
    if (inputsLocked) {
      // Open image in new tab for inspection when locked
      const image = currentImages[type];
      if (image) {
        window.open(`/api/static${image.path}`, '_blank');
      }
      return;
    }
    openImageModal(type);
  };

  return {
    // UI State
    imageModal,
    historyPanel,
    
    // Image data
    images: images || [],
    imagesLoading,
    imagesError,
    
    // Actions
    openImageModal,
    closeImageModal,
    openHistoryPanel,
    closeHistoryPanel,
    handleImageSelection,
    handleImageClick,
  };
}