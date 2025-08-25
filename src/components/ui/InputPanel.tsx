// Image input section component matching screenshot design
'use client';

interface InputImage {
  type: 'model' | 'clothing' | 'person';
  path?: string;
  filename?: string;
}

interface InputPanelProps {
  images: {
    model?: InputImage;
    clothing?: InputImage;
    person?: InputImage;
  };
  onImageSelect: (type: 'model' | 'clothing' | 'person') => void;
  disabled?: boolean;
}

export default function InputPanel({ images, onImageSelect, disabled = false }: InputPanelProps) {
  const imageTypes = [
    { type: 'model' as const, label: 'Model', description: 'Select the model image' },
    { type: 'clothing' as const, label: 'Top Garment', description: 'Select the top garment' },
    { type: 'person' as const, label: 'Bottom Garment', description: 'Select the bottom garment' }
  ];

  return (
    <div className="bg-white rounded-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Input Images</h2>
      </div>

      {/* Image Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {imageTypes.map(({ type, label, description: _description }, _index) => {
          const image = images[type];
          const hasImage = image?.path;

          return (
            <div key={type} className="flex flex-col items-center">
              {/* Label */}
              <h3 className="text-lg font-medium text-gray-900 mb-4">{label}</h3>
              
              {/* Image Container */}
              <div className="relative">
                <button
                  onClick={() => !disabled && onImageSelect(type)}
                  disabled={disabled}
                  className={`
                    w-48 h-64 border-2 rounded-lg transition-colors overflow-hidden
                    ${disabled 
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                      : 'border-gray-300 hover:border-gray-400 cursor-pointer bg-white'
                    }
                  `}
                >
                  {hasImage ? (
                    <div className="w-full h-full relative bg-gray-100 flex items-center justify-center">
                      {/* Mock image placeholder - In real app, would show actual image */}
                      <div className="text-center p-4">
                        <div className="w-16 h-20 bg-gray-300 rounded mx-auto mb-2 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                          </svg>
                        </div>
                        <p className="text-xs text-gray-600">{image?.filename}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center p-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Click to select</p>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}