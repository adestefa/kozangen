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
  locked?: boolean;
}

export default function InputPanel({ images, onImageSelect, disabled = false, locked = false }: InputPanelProps) {
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
                  title={locked ? `Click to inspect ${label.toLowerCase()} image in new tab` : `Click to select ${label.toLowerCase()} image`}
                  className={`
                    w-48 h-64 border-2 rounded-lg transition-colors overflow-hidden relative
                    ${disabled 
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                      : locked
                        ? 'border-blue-500 bg-blue-50 cursor-pointer hover:border-blue-600'
                        : 'border-gray-300 hover:border-gray-400 cursor-pointer bg-white'
                    }
                  `}
                >
                  {hasImage ? (
                    <div className="w-full h-full relative bg-gray-100 overflow-hidden">
                      {/* Real selected image */}
                      <img
                        src={`/api/static/${image.path?.replace('/input/', '')}`}
                        alt={image?.filename}
                        className="w-full h-full object-cover"
                      />
                      {/* Filename overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                        <p className="text-xs text-center truncate">{image?.filename}</p>
                      </div>
                      
                      {/* Locked indicator */}
                      {locked && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
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