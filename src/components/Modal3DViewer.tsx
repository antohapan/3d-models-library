'use client';

import React, { useEffect } from 'react';
import { Model3D } from '../types/models';
import { Model3DViewer } from './Model3DViewer';

interface Modal3DViewerProps {
  model: Model3D;
  isOpen: boolean;
  onClose: () => void;
}

export const Modal3DViewer: React.FC<Modal3DViewerProps> = ({
  model,
  isOpen,
  onClose
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = model.path;
    link.download = model.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{model.name}</h2>
            {model.description && (
              <p className="text-gray-600 mt-1">{model.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Download Model"
            >
              <span>↓</span>
              Download
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3D Viewer - Now fills remaining space */}
        <div className="relative bg-gray-100 flex-1 min-h-0">
          <Model3DViewer 
            modelUrl={model.path}
            width={800}
            height={600}
            className="w-full h-full"
          />
          
          {/* Model info overlay */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
            <div className="text-sm">
              <div><strong>File:</strong> {model.filename}</div>
              {model.dateAdded && (
                <div><strong>Added:</strong> {new Date(model.dateAdded).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          {/* Controls overlay */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
            <div className="text-sm">
              <div>🖱️ Drag to rotate</div>
              <div>🔄 Auto-rotating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 