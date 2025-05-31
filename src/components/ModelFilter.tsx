'use client';

import React from 'react';
import { ModelFilter } from '../types/models';

interface ModelFilterProps {
  filter: ModelFilter;
  availableTags: string[];
  onFilterChange: (filter: ModelFilter) => void;
}

export const ModelFilterComponent: React.FC<ModelFilterProps> = ({
  filter,
  availableTags,
  onFilterChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filter,
      searchTerm: e.target.value,
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filter.tags.includes(tag)
      ? filter.tags.filter(t => t !== tag)
      : [...filter.tags, tag];
    
    onFilterChange({
      ...filter,
      tags: newTags,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      tags: [],
      searchTerm: '',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search input */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Models
          </label>
          <input
            id="search"
            type="text"
            value={filter.searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or description..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Clear filters button */}
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={filter.tags.length === 0 && filter.searchTerm === ''}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Tags filter */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter.tags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Active filters display */}
      {(filter.tags.length > 0 || filter.searchTerm) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Active filters:</strong>
            {filter.searchTerm && (
              <span className="ml-2 inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Search: &quot;{filter.searchTerm}&quot;
              </span>
            )}
            {filter.tags.map((tag) => (
              <span
                key={tag}
                className="ml-2 inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                Tag: {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 