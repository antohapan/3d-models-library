'use client';

import React, { useState, useEffect } from 'react';
import { Model3D, ModelFilter } from '../types/models';
import { ModelCard } from '../components/ModelCard';
import { ModelFilterComponent } from '../components/ModelFilter';
import { PreviewManager } from '../components/PreviewManager';

export default function Home() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model3D[]>([]);
  const [filter, setFilter] = useState<ModelFilter>({
    tags: [],
    searchTerm: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewManager, setShowPreviewManager] = useState(false);

  // Load models from API
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/models');
        if (!response.ok) {
          throw new Error('Failed to load models');
        }
        
        const data = await response.json();
        setModels(data.models || []);
        setFilteredModels(data.models || []);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load models. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // Filter models based on search term and tags
  useEffect(() => {
    let filtered = models;

    // Filter by search term
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(searchLower) ||
        model.description?.toLowerCase().includes(searchLower) ||
        model.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by tags
    if (filter.tags.length > 0) {
      filtered = filtered.filter(model =>
        filter.tags.every(tag => model.tags.includes(tag))
      );
    }

    setFilteredModels(filtered);
  }, [models, filter]);

  // Get all available tags
  const availableTags = Array.from(
    new Set(models.flatMap(model => model.tags))
  ).sort();

  const handlePreviewsGenerated = (count: number) => {
    alert(`Successfully generated ${count} previews!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading 3D models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Models</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">3D Models Library</h1>
            <p className="mt-2 text-gray-600">
              Browse and download 3D models in STL format
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter section */}
        <ModelFilterComponent
          filter={filter}
          availableTags={availableTags}
          onFilterChange={setFilter}
        />

        {/* Preview Manager Toggle */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowPreviewManager(!showPreviewManager)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showPreviewManager ? 'Hide' : 'Show'} Preview Manager
          </button>
          
          <button
            onClick={() => {
              try {
                const keys = Object.keys(localStorage);
                let clearedCount = 0;
                keys.forEach(key => {
                  if (key.startsWith('model_preview_')) {
                    localStorage.removeItem(key);
                    clearedCount++;
                  }
                });
                alert(`Cleared ${clearedCount} cached previews. Refresh to regenerate.`);
              } catch (error) {
                console.error('Error clearing cache:', error);
                alert('Error clearing cache');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Preview Cache
          </button>
        </div>

        {/* Preview Manager */}
        {showPreviewManager && (
          <PreviewManager 
            models={models} 
            onPreviewsGenerated={handlePreviewsGenerated}
          />
        )}

        {/* Models count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredModels.length} of {models.length} models
          </p>
        </div>

        {/* Models grid */}
        {filteredModels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
            <p className="text-gray-600">
              {models.length === 0
                ? 'No models are available in the library yet.'
                : 'Try adjusting your search criteria or filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>3D Models Library - Built with Next.js and Three.js</p>
            <p className="text-sm mt-1">Automatic preview generation powered by WebGL</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
