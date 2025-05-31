'use client';

import React, { useState } from 'react';
import { Model3D } from '../types/models';
import { Modal3DViewer } from './Modal3DViewer';
import { useModelPreview } from '../hooks/useModelPreview';

interface ModelCardProps {
  model: Model3D;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  console.log(`[ModelCard] Rendering ${model.name}`);
  
  // Use the preview hook with unique cache key for each model
  const { 
    previewUrl, 
    isGenerating: isGeneratingPreview, 
    error: previewError,
    generatePreview,
    clearCache
  } = useModelPreview(model.path, {
    cacheKey: `${model.id}_${model.filename}`, // Unique key combining ID and filename
    generateOnMount: true, // Always generate on mount
    previewOptions: {
      width: 300,
      height: 192,
      backgroundColor: 0xf0f0f0,
      modelColor: 0x4a90e2
    }
  });

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = model.path;
    link.download = model.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpen3DModal = () => {
    console.log(`[ModelCard] Opening 3D modal for ${model.name}`);
    setIsModalOpen(true);
  };

  const handleClose3DModal = () => {
    console.log(`[ModelCard] Closing 3D modal for ${model.name}`);
    setIsModalOpen(false);
  };

  const handleRegeneratePreview = () => {
    clearCache();
    generatePreview();
  };

  const getPreviewContent = () => {
    // Show generated preview or loading state
    if (isGeneratingPreview) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <span className="text-sm text-gray-600">Generating preview...</span>
            <div className="text-xs text-gray-500 mt-1">{model.name}</div>
          </div>
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <div className="text-center p-4">
            <div className="text-red-400 text-2xl mb-2">⚠️</div>
            <span className="text-sm text-red-600">Preview failed</span>
            <div className="text-xs text-red-500 mt-1">{previewError}</div>
            <button
              onClick={handleRegeneratePreview}
              className="block mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    if (previewUrl) {
      return (
        <img
          key={`preview-${model.id}`}
          src={previewUrl}
          alt={model.name}
          className="w-full h-full object-cover"
          onError={() => {
            console.error(`Failed to load preview image for ${model.name}`);
            handleRegeneratePreview();
          }}
        />
      );
    }

    // Fallback to placeholder if preview is not available
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
        <div className="text-center p-4">
          <div className="text-blue-400 text-3xl mb-2">📦</div>
          <span className="text-sm text-blue-600 font-medium">{model.name}</span>
          <button
            onClick={generatePreview}
            className="block mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Generate preview
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-48 bg-gray-100 cursor-pointer group" onClick={handleOpen3DModal}>
          {getPreviewContent()}
          
          {/* 3D View overlay on hover - only show when not generating */}
          {!isGeneratingPreview && (
            <div className="absolute inset-0 z-1 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="absolute inset-0 z-1 bg-black opacity-20"></div>
              <div className="relative bg-white bg-opacity-90 z-2 text-gray-800 px-4 py-2 rounded-lg font-medium">
                🎭 Click to view in 3D
              </div>
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpen3DModal();
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700 transition-colors z-10"
              title="View in 3D"
            >
              3D
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm hover:bg-gray-700 transition-colors z-10"
              title="Download Model"
            >
              ↓
            </button>
          </div>

          {/* Preview generation indicator */}
          {isGeneratingPreview && (
            <div className="absolute bottom-2 left-2 z-10">
              <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                Generating preview...
              </div>
            </div>
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute bottom-2 right-2 z-10">
              <div className="bg-black bg-opacity-75 text-white px-1 py-0.5 rounded text-xs">
                {model.id}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{model.name}</h3>
          
          {model.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{model.description}</p>
          )}
          
          <div className="flex flex-wrap gap-1 mb-3">
            {model.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{model.filename}</span>
            {model.dateAdded && (
              <span>{new Date(model.dateAdded).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3D Modal */}
      <Modal3DViewer
        model={model}
        isOpen={isModalOpen}
        onClose={handleClose3DModal}
      />
    </>
  );
}; 