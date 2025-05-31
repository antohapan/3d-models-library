'use client';

import React, { useState } from 'react';
import { Model3D } from '../types/models';
import { generateModelPreview } from '../utils/previewGenerator';

interface PreviewManagerProps {
  models: Model3D[];
  onPreviewsGenerated?: (count: number) => void;
}

export const PreviewManager: React.FC<PreviewManagerProps> = ({ 
  models, 
  onPreviewsGenerated 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);

  const generateAllPreviews = async (clearCacheFirst = false) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: models.length });
    setErrors([]);

    // Clear cache if requested
    if (clearCacheFirst) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('model_preview_')) {
            localStorage.removeItem(key);
          }
        });
        console.log('Cleared all cached previews');
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }

    let successCount = 0;
    const newErrors: string[] = [];

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      setProgress({ current: i + 1, total: models.length });

      try {
        console.log(`Generating preview ${i + 1}/${models.length} for: ${model.name}`);
        
        const previewUrl = await generateModelPreview(model.path, {
          width: 300,
          height: 192,
          backgroundColor: 0xf0f0f0,
          modelColor: 0x4a90e2
        });
        
        // Save to cache with unique key
        const keyData = {
          url: model.path,
          custom: `${model.id}_${model.filename}`,
          options: JSON.stringify({
            width: 300,
            height: 192,
            backgroundColor: 0xf0f0f0,
            modelColor: 0x4a90e2
          })
        };
        const keyString = JSON.stringify(keyData);
        const cacheKey = `model_preview_${btoa(keyString)}`;
        
        const cacheData = {
          dataUrl: previewUrl,
          timestamp: Date.now(),
          modelUrl: model.path
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
        successCount++;
        console.log(`Successfully generated preview for: ${model.name}`);
      } catch (error) {
        const errorMessage = `Failed to generate preview for ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        newErrors.push(errorMessage);
        console.error('Preview generation error:', error);
      }

      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    setErrors(newErrors);
    setIsGenerating(false);
    
    if (onPreviewsGenerated) {
      onPreviewsGenerated(successCount);
    }
  };

  const clearAllPreviews = () => {
    try {
      const keys = Object.keys(localStorage);
      let clearedCount = 0;
      
      keys.forEach(key => {
        if (key.startsWith('model_preview_')) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });

      alert(`Cleared ${clearedCount} cached previews`);
    } catch (error) {
      console.error('Error clearing previews:', error);
      alert('Error clearing cache');
    }
  };

  const getCachedPreviewsCount = (): number => {
    try {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith('model_preview_')).length;
    } catch {
      return 0;
    }
  };

  const getCacheSize = (): string => {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('model_preview_')) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      });

      // Convert to MB
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      return `${sizeMB} MB`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Preview Management</h3>
          <div className="text-sm text-gray-600">
            Cache: {getCachedPreviewsCount()} previews ({getCacheSize()})
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => generateAllPreviews(false)}
            disabled={isGenerating || models.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : `Generate All Previews (${models.length})`}
          </button>

          <button
            onClick={() => generateAllPreviews(true)}
            disabled={isGenerating || models.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Regenerate All Previews
          </button>

          <button
            onClick={clearAllPreviews}
            disabled={isGenerating}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Clear Cache
          </button>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` 
                }}
              />
            </div>
            {progress.current > 0 && (
              <div className="text-sm text-gray-600">
                Processing: {models[progress.current - 1]?.name}
              </div>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-800 font-medium mb-2">Errors ({errors.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-red-700 text-sm">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>• <strong>Generate All Previews:</strong> Creates previews only for models without cached previews</p>
          <p>• <strong>Regenerate All Previews:</strong> Clears cache and creates fresh previews for all models</p>
          <p>• <strong>Clear Cache:</strong> Removes all cached previews to free up storage space</p>
          <p>• Generated previews are cached in browser storage for 7 days</p>
        </div>
      </div>
    </div>
  );
}; 