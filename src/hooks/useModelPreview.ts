'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateModelPreview, PreviewOptions } from '../utils/previewGenerator';

interface UseModelPreviewOptions {
  cacheKey?: string;
  previewOptions?: PreviewOptions;
  generateOnMount?: boolean;
}

interface UseModelPreviewReturn {
  previewUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  generatePreview: () => Promise<void>;
  clearCache: () => void;
}

const CACHE_PREFIX = 'model_preview_';
const CACHE_EXPIRY_DAYS = 7;

export const useModelPreview = (
  modelUrl: string,
  options: UseModelPreviewOptions = {}
): UseModelPreviewReturn => {
  const {
    cacheKey,
    previewOptions,
    generateOnMount = true
  } = options;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique cache key based on model URL and options
  const getCacheKey = useCallback(() => {
    const keyData = {
      url: modelUrl,
      custom: cacheKey,
      options: previewOptions ? JSON.stringify(previewOptions) : null
    };
    const keyString = JSON.stringify(keyData);
    try {
      return `${CACHE_PREFIX}${btoa(keyString)}`;
    } catch {
      // Fallback if btoa fails
      return `${CACHE_PREFIX}${encodeURIComponent(keyString)}`;
    }
  }, [modelUrl, cacheKey, previewOptions]);

  // Check if cache is valid
  const isCacheValid = useCallback((cacheData: any): boolean => {
    if (!cacheData || !cacheData.timestamp || !cacheData.dataUrl) {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - cacheData.timestamp;
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    return cacheAge < maxAge;
  }, []);

  // Load from cache
  const loadFromCache = useCallback((): string | null => {
    try {
      const cacheKeyValue = getCacheKey();
      const cached = localStorage.getItem(cacheKeyValue);
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (isCacheValid(cacheData)) {
          console.log(`Loaded preview from cache for: ${modelUrl}`);
          return cacheData.dataUrl;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKeyValue);
          console.log(`Removed expired cache for: ${modelUrl}`);
        }
      }
    } catch (error) {
      console.warn('Error loading preview from cache:', error);
    }
    return null;
  }, [getCacheKey, isCacheValid, modelUrl]);

  // Save to cache
  const saveToCache = useCallback((dataUrl: string) => {
    try {
      const cacheData = {
        dataUrl,
        timestamp: Date.now(),
        modelUrl,
        options: previewOptions
      };
      const cacheKeyValue = getCacheKey();
      localStorage.setItem(cacheKeyValue, JSON.stringify(cacheData));
      console.log(`Saved preview to cache for: ${modelUrl}`);
    } catch (error) {
      console.warn('Error saving preview to cache:', error);
    }
  }, [getCacheKey, modelUrl, previewOptions]);

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (isGenerating || !modelUrl) return;

    try {
      setIsGenerating(true);
      setError(null);

      console.log(`[Preview Hook] Starting preview generation for: ${modelUrl}`);
      console.log(`[Preview Hook] Preview options:`, previewOptions);
      
      const dataUrl = await generateModelPreview(modelUrl, previewOptions);
      
      if (dataUrl && dataUrl.length > 100) { // Basic validation
        setPreviewUrl(dataUrl);
        saveToCache(dataUrl);
        console.log(`[Preview Hook] Successfully generated preview for: ${modelUrl}, data length: ${dataUrl.length}`);
      } else {
        throw new Error('Generated preview appears to be invalid or too short');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      console.error(`[Preview Hook] Detailed error for ${modelUrl}:`, {
        error: err,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : 'No stack trace',
        modelUrl,
        previewOptions
      });
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      console.log(`[Preview Hook] Preview generation completed for: ${modelUrl}`);
    }
  }, [modelUrl, previewOptions, isGenerating, saveToCache]);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      const cacheKeyValue = getCacheKey();
      localStorage.removeItem(cacheKeyValue);
      setPreviewUrl(null);
      console.log(`Cleared cache for: ${modelUrl}`);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }, [getCacheKey, modelUrl]);

  // Load on mount
  useEffect(() => {
    if (!modelUrl) return;

    // First, try to load from cache
    const cachedPreview = loadFromCache();
    if (cachedPreview) {
      setPreviewUrl(cachedPreview);
      return;
    }

    // If not in cache and generateOnMount is true, generate new preview
    if (generateOnMount) {
      generatePreview();
    }
  }, [modelUrl, generateOnMount, loadFromCache, generatePreview]);

  return {
    previewUrl,
    isGenerating,
    error,
    generatePreview,
    clearCache
  };
};

// Utility hook for multiple previews (different angles)
export const useMultipleModelPreviews = (
  modelUrl: string,
  angles: { x: number; y: number; z: number }[] = [
    { x: 0.7, y: 0.5, z: 1 }  // Default angle only
  ]
) => {
  const [previews, setPreviews] = useState<(string | null)[]>(new Array(angles.length).fill(null));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreviews = useCallback(async () => {
    if (isGenerating || !modelUrl) return;

    try {
      setIsGenerating(true);
      setError(null);

      console.log(`Generating ${angles.length} previews for: ${modelUrl}`);

      const previewPromises = angles.map(async (angle, index) => {
        try {
          const distance = 2.5;
          const dataUrl = await generateModelPreview(modelUrl, {
            cameraPosition: {
              x: distance * angle.x,
              y: distance * angle.y,
              z: distance * angle.z
            }
          });
          console.log(`Generated preview ${index + 1}/${angles.length} for: ${modelUrl}`);
          return { index, dataUrl };
        } catch (err) {
          console.error(`Error generating preview for angle ${index}:`, err);
          return { index, dataUrl: null };
        }
      });

      const results = await Promise.all(previewPromises);
      
      setPreviews(prev => {
        const newPreviews = [...prev];
        results.forEach(({ index, dataUrl }) => {
          newPreviews[index] = dataUrl;
        });
        return newPreviews;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate previews';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [modelUrl, angles, isGenerating]);

  useEffect(() => {
    if (modelUrl) {
      generatePreviews();
    }
  }, [modelUrl, generatePreviews]);

  return {
    previews,
    isGenerating,
    error,
    generatePreviews
  };
}; 